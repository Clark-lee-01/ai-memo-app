// components/notes/summary-section.tsx
// 노트 요약 섹션 컴포넌트 - 요약 생성, 표시, 재생성 기능
// AI 메모장 프로젝트의 노트 요약 UI 컴포넌트
// 관련 파일: app/notes/[noteId]/page.tsx, app/actions/notes.ts

'use client';

import { useState, useTransition } from 'react';
import { generateNoteSummary } from '@/app/actions/notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle, RefreshCw, FileText, AlertCircle, CheckCircle, Clock, Edit } from 'lucide-react';
import { useAIStatus } from '@/lib/hooks/useAIStatus';
import { useRegeneration } from '@/lib/hooks/useRegeneration';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SummaryEditor } from './summary-editor';

interface SummarySectionProps {
  noteId: string;
  initialSummary?: {
    content: string;
    createdAt: Date;
  } | null;
}

export function SummarySection({ noteId, initialSummary }: SummarySectionProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const aiStatus = useAIStatus();

  // 재생성 함수 정의
  const regenerationFunction = async (overwrite: boolean) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const result = await generateNoteSummary(noteId, overwrite);
          resolve(result);
        } catch (error) {
          resolve({ success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' });
        }
      });
    });
  };

  // 재생성 훅 사용
  const regeneration = useRegeneration('summary', regenerationFunction, {
    onSuccess: (result) => {
      if (result.success && result.summary) {
        setSummary({
          content: result.summary,
          createdAt: new Date(),
        });
      }
    },
    onError: (error) => {
      console.error('요약 재생성 실패:', error);
    }
  });

  const handleGenerateSummary = (overwrite: boolean = false) => {
    aiStatus.reset();
    aiStatus.startProcessing();

    startTransition(async () => {
      try {
        const result = await generateNoteSummary(noteId, overwrite);
        
        if (result.success) {
          setSummary({
            content: result.summary!,
            createdAt: new Date(),
          });
          aiStatus.markSuccess();
        } else {
          if (result.hasExistingSummary) {
            // 기존 요약이 있는 경우 덮어쓰기 확인
            const confirmed = window.confirm(
              '이미 요약이 존재합니다. 덮어쓰시겠습니까?'
            );
            if (confirmed) {
              handleGenerateSummary(true);
              return;
            } else {
              aiStatus.reset();
            }
          } else {
            aiStatus.markError(new Error(result.error));
          }
        }
      } catch (err) {
        aiStatus.markError(err);
      }
    });
  };

  const handleRegenerateSummary = () => {
    regeneration.handleRegenerateClick();
  };

  // 편집 핸들러
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleSaveEditing = (content: string) => {
    setSummary({
      content,
      createdAt: new Date(),
    });
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const formatSummaryContent = (content: string) => {
    // 불릿 포인트로 분리하여 표시
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim().replace(/^[-•]\s*/, '')); // 불릿 포인트 제거
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 처리 상태 표시 */}
        {aiStatus.isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>AI가 요약을 생성하고 있습니다...</span>
          </div>
        )}

        {aiStatus.isSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>요약이 성공적으로 생성되었습니다</span>
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
                  onClick={() => handleGenerateSummary()}
                  className="ml-2 h-6 text-xs"
                >
                  재시도
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {summary ? (
          isEditing ? (
            <SummaryEditor
              noteId={noteId}
              initialContent={summary.content}
              onSave={handleSaveEditing}
              onCancel={handleCancelEditing}
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {formatSummaryContent(summary.content).map((point, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-sm text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  생성일: {new Date(summary.createdAt).toLocaleString('ko-KR')}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartEditing}
                    disabled={regeneration.isRegenerating || isPending}
                    className="h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    편집
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateSummary}
                    disabled={!regeneration.canRegenerate || isPending}
                    className="h-8"
                  >
                    {regeneration.isRegenerating || isPending ? (
                      <LoaderCircle className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    재생성
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              AI가 노트의 핵심 내용을 요약해드립니다
            </p>
            <Button
              onClick={() => handleGenerateSummary()}
              disabled={aiStatus.isProcessing || isPending}
              className="w-full"
            >
              {aiStatus.isLoading || isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  요약 생성 중...
                </>
              ) : (
                '요약 생성하기'
              )}
            </Button>
          </div>
        )}

        {/* 재생성 확인 다이얼로그 */}
        <AlertDialog open={regeneration.showOverwriteDialog} onOpenChange={regeneration.cancelOverwrite}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>요약 재생성 확인</AlertDialogTitle>
              <AlertDialogDescription>
                이미 요약이 존재합니다. 기존 요약을 덮어쓰시겠습니까?
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
                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                    재생성 중...
                  </>
                ) : (
                  '덮어쓰기'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
