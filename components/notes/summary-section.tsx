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
import { LoaderCircle, RefreshCw, FileText, AlertCircle } from 'lucide-react';

interface SummarySectionProps {
  noteId: string;
  initialSummary?: {
    content: string;
    createdAt: Date;
  } | null;
}

export function SummarySection({ noteId, initialSummary }: SummarySectionProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerateSummary = (overwrite: boolean = false) => {
    setError(null);
    setIsGenerating(true);

    startTransition(async () => {
      try {
        const result = await generateNoteSummary(noteId, overwrite);
        
        if (result.success) {
          setSummary({
            content: result.summary!,
            createdAt: new Date(),
          });
        } else {
          if (result.hasExistingSummary) {
            // 기존 요약이 있는 경우 덮어쓰기 확인
            const confirmed = window.confirm(
              '이미 요약이 존재합니다. 덮어쓰시겠습니까?'
            );
            if (confirmed) {
              handleGenerateSummary(true);
              return;
            }
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        setError('요약 생성 중 오류가 발생했습니다.');
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleRegenerateSummary = () => {
    handleGenerateSummary(true);
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
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary ? (
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateSummary}
                disabled={isGenerating || isPending}
                className="h-8"
              >
                {isGenerating || isPending ? (
                  <LoaderCircle className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                재생성
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              AI가 노트의 핵심 내용을 요약해드립니다
            </p>
            <Button
              onClick={() => handleGenerateSummary()}
              disabled={isGenerating || isPending}
              className="w-full"
            >
              {isGenerating || isPending ? (
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
      </CardContent>
    </Card>
  );
}
