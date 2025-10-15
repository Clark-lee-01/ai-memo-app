// components/cost/token-cost-management.tsx
// 토큰 비용 관리 컴포넌트
// API 비용 계산, 예측, 최적화 제안을 제공
// 관련 파일: lib/monitoring/tokenMonitor.ts, components/analytics/token-usage-analytics.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  Calculator,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

// 비용 데이터 인터페이스
interface CostData {
  currentCost: number;
  projectedCost: number;
  costPerToken: number;
  costBreakdown: {
    input: number;
    output: number;
    total: number;
  };
  optimizationSuggestions: {
    type: 'reduce' | 'optimize' | 'schedule';
    title: string;
    description: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  costTrend: {
    date: string;
    cost: number;
  }[];
}

// 비용 관리 컴포넌트
export default function TokenCostManagement({ 
  userId, 
  isAdmin = false 
}: { 
  userId?: string; 
  isAdmin?: boolean; 
}) {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 비용 데이터 로드
  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/token-usage/cost?userId=${userId || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('비용 데이터를 불러올 수 없습니다');
      }

      const data = await response.json();
      setCostData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadCostData();
  }, [userId]);

  // 비용 최적화 실행
  const applyOptimization = async (suggestionId: string) => {
    try {
      const response = await fetch('/api/token-usage/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('최적화를 적용할 수 없습니다');
      }

      // 데이터 새로고침
      await loadCostData();
    } catch (err) {
      console.error('최적화 적용 오류:', err);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">비용 관리</h2>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">로딩 중...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">비용 관리</h2>
          <Button variant="outline" size="sm" onClick={loadCostData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터 없음
  if (!costData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">비용 관리</h2>
          <Button variant="outline" size="sm" onClick={loadCostData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">비용 데이터를 불러올 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">비용 관리</h2>
          <p className="text-muted-foreground">
            AI 토큰 사용량에 따른 비용을 관리하고 최적화합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCostData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 비용 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 현재 비용 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData.currentCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              이번 달
            </p>
          </CardContent>
        </Card>

        {/* 예상 비용 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예상 비용</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData.projectedCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              다음 달 예상
            </p>
          </CardContent>
        </Card>

        {/* 토큰당 비용 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">토큰당 비용</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData.costPerToken.toFixed(6)}
            </div>
            <p className="text-xs text-muted-foreground">
              평균 비용
            </p>
          </CardContent>
        </Card>

        {/* 비용 절약 가능 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">절약 가능</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${costData.optimizationSuggestions
                .reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              최적화 제안
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 비용 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            비용 분석
          </CardTitle>
          <CardDescription>
            토큰 사용량에 따른 비용 세부 분석
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${costData.costBreakdown.input.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">입력 토큰 비용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${costData.costBreakdown.output.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">출력 토큰 비용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${costData.costBreakdown.total.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">총 비용</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최적화 제안 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            최적화 제안
          </CardTitle>
          <CardDescription>
            비용 절약을 위한 최적화 제안사항
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {costData.optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <Badge 
                    variant={
                      suggestion.priority === 'high' ? 'destructive' :
                      suggestion.priority === 'medium' ? 'secondary' :
                      'outline'
                    }
                  >
                    {suggestion.priority === 'high' ? '높음' :
                     suggestion.priority === 'medium' ? '보통' : '낮음'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">
                    절약 가능: ${suggestion.potentialSavings.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyOptimization(index.toString())}
                >
                  적용
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 비용 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            비용 트렌드
          </CardTitle>
          <CardDescription>
            최근 7일간 비용 변화 추이
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costData.costTrend.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{day.date}</span>
                  {index > 0 && (
                    <div className="flex items-center gap-1">
                      {day.cost > costData.costTrend[index - 1].cost ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">${day.cost.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground text-center">
          마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );
}
