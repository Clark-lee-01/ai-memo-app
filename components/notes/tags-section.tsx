// components/notes/tags-section.tsx
// 노트 태그 섹션 컴포넌트 - 태그 표시, 생성, 재생성 기능
// AI 메모장 프로젝트의 태그 관리 UI 컴포넌트
// 관련 파일: app/notes/[noteId]/page.tsx, app/actions/notes.ts

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateNoteTags, getNoteTags } from '@/app/actions/notes';
import { Loader2, Tag, RefreshCw } from 'lucide-react';

interface TagsSectionProps {
  noteId: string;
  initialTags?: string[];
}

export default function TagsSection({ noteId, initialTags = [] }: TagsSectionProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  // 태그 생성 핸들러
  const handleGenerateTags = async (overwrite: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateNoteTags(noteId, overwrite);
      
      if (result.success) {
        setTags(result.tags || []);
        setShowOverwriteDialog(false);
      } else {
        if (result.hasExistingTags) {
          setShowOverwriteDialog(true);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('태그 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 태그 재생성 핸들러
  const handleRegenerateTags = () => {
    setShowOverwriteDialog(true);
  };

  // 덮어쓰기 확인 핸들러
  const handleOverwriteConfirm = () => {
    handleGenerateTags(true);
  };

  // 덮어쓰기 취소 핸들러
  const handleOverwriteCancel = () => {
    setShowOverwriteDialog(false);
  };

  return (
    <div className="space-y-4">
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
            disabled={isGenerating}
            className="h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
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
          disabled={isGenerating}
          size="sm"
          className="h-8"
        >
          {isGenerating ? (
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

      {/* 에러 메시지 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      )}

      {/* 덮어쓰기 확인 다이얼로그 */}
      {showOverwriteDialog && (
        <div className="bg-muted/50 p-4 rounded-md border">
          <p className="text-sm text-muted-foreground mb-3">
            이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleOverwriteConfirm}
              disabled={isGenerating}
              size="sm"
              className="h-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  생성 중...
                </>
              ) : (
                '덮어쓰기'
              )}
            </Button>
            <Button
              onClick={handleOverwriteCancel}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isGenerating}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
