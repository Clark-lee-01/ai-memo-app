// components/notes/tags-section.tsx
// 노트 태그 섹션 컴포넌트 - 태그 표시, 생성, 재생성 기능
// AI 메모장 프로젝트의 태그 관리 UI 컴포넌트
// 관련 파일: app/notes/[noteId]/page.tsx, app/actions/notes.ts

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateNoteTags, getNoteTags } from '@/app/actions/notes';
import { Loader2, Tag, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAIStatus } from '@/lib/hooks/useAIStatus';
import { useRegeneration } from '@/lib/hooks/useRegeneration';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TagsSectionProps {
  noteId: string;
  initialTags?: string[];
}

export default function TagsSection({ noteId, initialTags = [] }: TagsSectionProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const aiStatus = useAIStatus();

  // 재생성 함수 정의
  const regenerationFunction = async (overwrite: boolean) => {
    try {
      const result = await generateNoteTags(noteId, overwrite);
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  };

  // 재생성 훅 사용
  const regeneration = useRegeneration('tags', regenerationFunction, {
    onSuccess: (result) => {
      if (result.success && result.tags) {
        setTags(result.tags);
      }
    },
    onError: (error) => {
      console.error('태그 재생성 실패:', error);
    }
  });

  // 태그 생성 핸들러
  const handleGenerateTags = async (overwrite: boolean = false) => {
    aiStatus.reset();
    aiStatus.startProcessing();

    try {
      const result = await generateNoteTags(noteId, overwrite);
      
      if (result.success) {
        setTags(result.tags || []);
        aiStatus.markSuccess();
      } else {
        if (result.hasExistingTags) {
          regeneration.handleRegenerateClick();
          aiStatus.reset();
        } else {
          aiStatus.markError(new Error(result.error));
        }
      }
    } catch (err) {
      aiStatus.markError(err);
    }
  };

  // 태그 재생성 핸들러
  const handleRegenerateTags = () => {
    regeneration.handleRegenerateClick();
  };

  return (
    <div className="space-y-4">
      {/* AI 처리 상태 표시 */}
      {aiStatus.isLoading && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI가 태그를 생성하고 있습니다...</span>
        </div>
      )}

      {aiStatus.isSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <span>태그가 성공적으로 생성되었습니다</span>
          {aiStatus.processingTime && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
              <Clock className="h-3 w-3" />
              {aiStatus.processingTime}초
            </span>
          )}
        </div>
      )}

      {aiStatus.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{aiStatus.getErrorMessage()}</span>
            {aiStatus.canRetry() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateTags()}
                className="ml-2 h-6 text-xs"
              >
                재시도
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 태그 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">태그</h3>
        </div>
        
        {tags.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateTags}
            disabled={!regeneration.canRegenerate}
            className="h-8"
          >
            {regeneration.isRegenerating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            재생성
          </Button>
        )}
      </div>

      {/* 태그 목록 */}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          아직 생성된 태그가 없습니다.
        </div>
      )}

      {/* 태그 생성 버튼 */}
      {tags.length === 0 && (
        <Button
          onClick={() => handleGenerateTags(false)}
          disabled={!regeneration.canRegenerate}
          size="sm"
          className="h-8"
        >
          {regeneration.isRegenerating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              태그 생성 중...
            </>
          ) : (
            <>
              <Tag className="h-3 w-3 mr-1" />
              AI 태그 생성
            </>
          )}
        </Button>
      )}

      {/* 재생성 확인 다이얼로그 */}
      <AlertDialog open={regeneration.showOverwriteDialog} onOpenChange={regeneration.cancelOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>태그 재생성 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={regeneration.cancelOverwrite}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={regeneration.confirmOverwrite}
              disabled={regeneration.isRegenerating}
            >
              {regeneration.isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  재생성 중...
                </>
              ) : (
                '덮어쓰기'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
