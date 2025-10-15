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
  const [testText, setTestText] = useState('인공지능과 머신러닝 기술이 빠르게 발전하고 있습니다. 주요 발전 방향: 1. 딥러닝 모델의 크기와 복잡성이 증가하고 있으며, GPT-4와 같은 대규모 언어 모델이 등장했습니다. 2. 자율주행 자동차 기술이 상용화 단계에 접어들었고, Tesla, Waymo 등이 선도하고 있습니다. 3. 의료 분야에서 AI는 진단 정확도를 크게 향상시키고 있으며, 개인맞춤형 치료가 가능해지고 있습니다. 4. 자연어 처리 기술이 발전하여 ChatGPT, Claude 같은 대화형 AI가 일상생활에 자리잡았습니다. 향후 전망: - AGI(일반인공지능) 달성 가능성이 높아지고 있습니다. - 양자컴퓨팅과 AI의 결합으로 새로운 돌파구가 예상됩니다. - AI 윤리와 규제가 중요한 이슈로 부상하고 있습니다. - 인간과 AI의 협업이 새로운 노동 패러다임을 만들 것입니다.');
  const [summary, setSummary] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<{ status: 'healthy' | 'error'; message: string; tokenUsage?: { daily: number; hourly: number; limits: { daily: number; monthly: number } } } | null>(null);
  const [testResults, setTestResults] = useState<{
    summaryTime?: number;
    tagsTime?: number;
    statusTime?: number;
  }>({});

  const testSummarize = async () => {
    if (!testText.trim()) {
      setError('테스트할 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/test-gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      const data = await response.json();
      const endTime = Date.now();

      if (data.success) {
        setSummary(data.summary);
        setTestResults(prev => ({ ...prev, summaryTime: endTime - startTime }));
      } else {
        setError(data.error || '요약 생성에 실패했습니다.');
      }
    } catch {
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
    const startTime = Date.now();

    try {
      const response = await fetch('/api/test-gemini/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      const data = await response.json();
      const endTime = Date.now();

      if (data.success) {
        setTags(data.tags);
        setTestResults(prev => ({ ...prev, tagsTime: endTime - startTime }));
      } else {
        setError(data.error || '태그 생성에 실패했습니다.');
      }
    } catch {
      setError('태그 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiStatus = async () => {
    setIsLoading(true);
    setError('');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/test-gemini/status');
      const data = await response.json();
      const endTime = Date.now();

      if (data.success) {
        setApiStatus(data.status);
        setTestResults(prev => ({ ...prev, statusTime: endTime - startTime }));
      } else {
        setError(data.error || 'API 상태 확인에 실패했습니다.');
      }
    } catch {
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
    setTestResults({});
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
                <div className="space-y-2">
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
                    {testResults.statusTime && (
                      <span className="text-xs text-gray-500">({testResults.statusTime}ms)</span>
                    )}
                  </div>
                  {apiStatus.tokenUsage && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>일간 사용량: {apiStatus.tokenUsage.daily} 토큰</div>
                      <div>시간당 사용량: {apiStatus.tokenUsage.hourly} 토큰</div>
                      <div>일간 제한: {apiStatus.tokenUsage.limits.daily} 토큰</div>
                    </div>
                  )}
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
                {testResults.summaryTime && (
                  <span className="text-sm text-gray-500 ml-auto">({testResults.summaryTime}ms)</span>
                )}
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
                {testResults.tagsTime && (
                  <span className="text-sm text-gray-500 ml-auto">({testResults.tagsTime}ms)</span>
                )}
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
            <CardTitle>사용법 및 기능</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-semibold mb-1">1. API 상태 확인</p>
              <p>• Gemini API 연결 상태 및 토큰 사용량 확인</p>
              <p>• 응답 시간 측정 및 실시간 모니터링</p>
            </div>
            <div>
              <p className="font-semibold mb-1">2. 요약 생성 테스트</p>
              <p>• 텍스트를 3-6개의 불릿 포인트로 요약</p>
              <p>• 처리 시간 측정 및 품질 검증</p>
            </div>
            <div>
              <p className="font-semibold mb-1">3. 태그 생성 테스트</p>
              <p>• 텍스트의 주요 키워드를 최대 6개 태그로 추출</p>
              <p>• 관련성 높은 태그 자동 생성</p>
            </div>
            <div>
              <p className="font-semibold mb-1">4. 성능 모니터링</p>
              <p>• 각 API 호출의 응답 시간 측정</p>
              <p>• 토큰 사용량 추적 및 제한 관리</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>주의:</strong> 이 페이지는 개발 환경에서만 사용하세요. 프로덕션에서는 제거해야 합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
