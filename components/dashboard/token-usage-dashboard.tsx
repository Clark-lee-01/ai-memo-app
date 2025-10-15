// components/dashboard/token-usage-dashboard.tsx
// 토큰 사용량 대시보드 컴포넌트
// 실시간 토큰 사용량 모니터링 및 시각화
// 관련 파일: lib/monitoring/tokenMonitor.ts, components/ui/card.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Settings, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

// 토큰 사용량 인터페이스
interface TokenUsageData {
  daily: number;
  hourly: number;
  limits: {
    daily: number;
    hourly: number;
    perRequest: number;
    warningThreshold: number;
  };
  stats: {
    totalUsage: number;
    averageDaily: number;
    peakHourly: number;
    operations: { [key: string]: number };
  };
}

// 경고 레벨 타입
type WarningLevel = 'none' | 'warning' | 'critical';

// 토큰 사용량 대시보드 컴포넌트
export default function TokenUsageDashboard({ userId }: { userId?: string }) {
  const [usageData, setUsageData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 사용량 데이터 로드
  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/token-usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('사용량 데이터를 불러올 수 없습니다');
      }

      const data = await response.json();
      setUsageData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadUsageData();
    
    // 30초마다 데이터 새로고침
    const interval = setInterval(loadUsageData, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // 경고 레벨 계산
  const getWarningLevel = (): WarningLevel => {
    if (!usageData) return 'none';
    
    const dailyUsage = usageData.daily;
    const dailyLimit = usageData.limits.daily;
    const warningThreshold = usageData.limits.warningThreshold;
    
    if (dailyUsage >= dailyLimit) return 'critical';
    if (dailyUsage >= dailyLimit * warningThreshold) return 'warning';
    return 'none';
  };

  // 사용률 계산
  const getUsagePercentage = (current: number, limit: number): number => {
    return Math.min((current / limit) * 100, 100);
  };

  // 경고 메시지 생성
  const getWarningMessage = (): string | null => {
    if (!usageData) return null;
    
    const warningLevel = getWarningLevel();
    const dailyUsage = usageData.daily;
    const dailyLimit = usageData.limits.daily;
    
    switch (warningLevel) {
      case 'critical':
        return `일일 토큰 사용량이 초과되었습니다 (${dailyUsage.toLocaleString()}/${dailyLimit.toLocaleString()})`;
      case 'warning':
        return `일일 토큰 사용량이 ${Math.round(usageData.limits.warningThreshold * 100)}%에 도달했습니다 (${dailyUsage.toLocaleString()}/${dailyLimit.toLocaleString()})`;
      default:
        return null;
    }
  };

  // 로딩 상태
  if (loading && !usageData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">토큰 사용량 대시보드</h2>
          <Button variant="outline" size="sm" disabled>
            <Activity className="h-4 w-4 mr-2" />
            로딩 중...
          </Button>
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
          <h2 className="text-2xl font-bold">토큰 사용량 대시보드</h2>
          <Button variant="outline" size="sm" onClick={loadUsageData}>
            <Activity className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터 없음
  if (!usageData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">토큰 사용량 대시보드</h2>
          <Button variant="outline" size="sm" onClick={loadUsageData}>
            <Activity className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">사용량 데이터를 불러올 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const warningLevel = getWarningLevel();
  const warningMessage = getWarningMessage();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">토큰 사용량 대시보드</h2>
          <p className="text-muted-foreground">
            AI 기능 사용량을 실시간으로 모니터링하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsageData}>
            <Activity className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {/* 경고 메시지 */}
      {warningMessage && (
        <Alert variant={warningLevel === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {/* 사용량 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 일일 사용량 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">일일 사용량</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.daily.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              / {usageData.limits.daily.toLocaleString()} 토큰
            </p>
            <div className="mt-2">
              <Progress 
                value={getUsagePercentage(usageData.daily, usageData.limits.daily)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* 시간당 사용량 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시간당 사용량</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.hourly.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              / {usageData.limits.hourly.toLocaleString()} 토큰
            </p>
            <div className="mt-2">
              <Progress 
                value={getUsagePercentage(usageData.hourly, usageData.limits.hourly)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* 평균 일일 사용량 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 일일 사용량</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(usageData.stats.averageDaily).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              최근 7일 평균
            </p>
          </CardContent>
        </Card>

        {/* 피크 시간당 사용량 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">피크 시간당 사용량</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.stats.peakHourly.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              최근 7일 최고치
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 작업별 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            작업별 사용량
          </CardTitle>
          <CardDescription>
            최근 7일간 작업 유형별 토큰 사용량
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(usageData.stats.operations).map(([operation, usage]) => (
              <div key={operation} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{operation}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">{usage.toLocaleString()} 토큰</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((usage / usageData.stats.totalUsage) * 100)}%
                  </div>
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
