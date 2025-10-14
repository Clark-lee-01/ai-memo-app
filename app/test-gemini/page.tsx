// app/test-gemini/page.tsx
// Gemini API 테스트 페이지 - 스토리 4.1 기능 검증
// AI 메모장 프로젝트의 Gemini API 테스트 및 디버깅 페이지
// 관련 파일: lib/ai/gemini.ts, app/actions/notes.ts

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoaderCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function TestGeminiPage() {
  const [testText, setTestText] = useState('안녕하세요. 이것은 AI 메모장 프로젝트의 테스트 텍스트입니다. 이 텍스트를 사용하여 Gemini API의 요약 및 태그 생성 기능을 테스트해보겠습니다.');
  const [summary, setSummary] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<{ status: 'healthy' | 'error'; message: string } | null>(null);

  const testSummarize = async () => {
    if (!testText.trim()) {
      setError('테스트할 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/test-gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.error || '요약 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('요약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const testTags = async () => {
    if (!testText.trim()) {
      setError('테스트할 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setTags([]);

    try {
      const response = await fetch('/api/test-gemini/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      const data = await response.json();

      if (data.success) {
        setTags(data.tags);
      } else {
        setError(data.error || '태그 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('태그 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiStatus = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/test-gemini/status');
      const data = await response.json();

      if (data.success) {
        setApiStatus(data.status);
      } else {
        setError(data.error || 'API 상태 확인에 실패했습니다.');
      }
    } catch (err) {
      setError('API 상태 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setSummary('');
    setTags([]);
    setError('');
    setApiStatus(null);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Gemini API 테스트</h1>
          <p className="text-gray-600">스토리 4.1의 Gemini API 기능을 테스트해보세요</p>
        </div>

        {/* API 상태 확인 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              API 상태 확인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button onClick={testApiStatus} disabled={isLoading}>
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                상태 확인
              </Button>
              {apiStatus && (
                <div className="flex items-center gap-2">
                  {apiStatus.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge variant={apiStatus.status === 'healthy' ? 'default' : 'destructive'}>
                    {apiStatus.status === 'healthy' ? '정상' : '오류'}
                  </Badge>
                  <span className="text-sm text-gray-600">{apiStatus.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 테스트 텍스트 입력 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 텍스트</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="테스트할 텍스트를 입력하세요..."
              rows={6}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={testSummarize} disabled={isLoading}>
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                요약 생성
              </Button>
              <Button onClick={testTags} disabled={isLoading} variant="outline">
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                태그 생성
              </Button>
              <Button onClick={clearResults} variant="ghost">
                결과 지우기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 요약 결과 */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                요약 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.split('\n').map((point, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-sm">{point.trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 태그 결과 */}
        {tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                태그 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용법 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>사용법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>API 상태 확인</strong>: Gemini API 연결 상태를 확인합니다.</p>
            <p>2. <strong>테스트 텍스트 입력</strong>: 요약하거나 태그를 생성할 텍스트를 입력합니다.</p>
            <p>3. <strong>요약 생성</strong>: 텍스트의 핵심 내용을 3-6개의 불릿 포인트로 요약합니다.</p>
            <p>4. <strong>태그 생성</strong>: 텍스트의 주요 키워드를 최대 6개의 태그로 생성합니다.</p>
            <p className="text-xs text-gray-500 mt-4">
              * 이 페이지는 개발 환경에서만 사용하세요. 프로덕션에서는 제거해야 합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
