// components/analytics/token-usage-analytics.tsx
// 토큰 사용량 분석 컴포넌트
// 사용량 통계, 트렌드 분석, 사용자별 분석을 제공
// 관련 파일: lib/monitoring/tokenMonitor.ts, components/dashboard/token-usage-dashboard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Zap,
  Clock
} from 'lucide-react';

// 분석 데이터 인터페이스
interface AnalyticsData {
  totalUsage: number;
  averageDaily: number;
  peakHourly: number;
  operations: { [key: string]: number };
  dailyTrend: { date: string; usage: number }[];
  hourlyTrend: { hour: string; usage: number }[];
  userStats: { userId: string; usage: number; operations: number }[];
}

// 분석 기간 타입
type AnalysisPeriod = '7d' | '30d' | '90d';

// 토큰 사용량 분석 컴포넌트
export default function TokenUsageAnalytics({ 
  userId, 
  isAdmin = false 
}: { 
  userId?: string; 
  isAdmin?: boolean; 
}) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalysisPeriod>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 분석 데이터 로드
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/token-usage/analytics?period=${period}&userId=${userId || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('분석 데이터를 불러올 수 없습니다');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAnalyticsData();
  }, [period, userId]);

  // 기간 변경 핸들러
  const handlePeriodChange = (newPeriod: AnalysisPeriod) => {
    setPeriod(newPeriod);
  };

  // 데이터 내보내기
  const exportData = () => {
    if (!analyticsData) return;
    
    const csvData = [
      ['날짜', '사용량', '작업 유형', '사용자 ID'],
      ...analyticsData.dailyTrend.map(day => [
        day.date,
        day.usage.toString(),
        'daily',
        userId || 'all'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">사용량 분석</h2>
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
          <h2 className="text-2xl font-bold">사용량 분석</h2>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터 없음
  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">사용량 분석</h2>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">분석 데이터를 불러올 수 없습니다</p>
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
          <h2 className="text-2xl font-bold">사용량 분석</h2>
          <p className="text-muted-foreground">
            토큰 사용량 통계와 트렌드를 분석합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 사용량 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용량</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === '7d' ? '최근 7일' : period === '30d' ? '최근 30일' : '최근 90일'}
            </p>
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
              {Math.round(analyticsData.averageDaily).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              토큰/일
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
              {analyticsData.peakHourly.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              토큰/시간
            </p>
          </CardContent>
        </Card>

        {/* 작업 수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 작업 수</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(analyticsData.operations).reduce((sum, count) => sum + count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              작업
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 작업별 사용량 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            작업별 사용량
          </CardTitle>
          <CardDescription>
            {period === '7d' ? '최근 7일' : period === '30d' ? '최근 30일' : '최근 90일'}간 작업 유형별 토큰 사용량
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analyticsData.operations)
              .sort(([,a], [,b]) => b - a)
              .map(([operation, usage]) => (
                <div key={operation} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{operation}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{usage.toLocaleString()} 토큰</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((usage / analyticsData.totalUsage) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 일일 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            일일 사용량 트렌드
          </CardTitle>
          <CardDescription>
            {period === '7d' ? '최근 7일' : period === '30d' ? '최근 30일' : '최근 90일'}간 일일 토큰 사용량 변화
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.dailyTrend.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{day.date}</span>
                  {index > 0 && (
                    <div className="flex items-center gap-1">
                      {day.usage > analyticsData.dailyTrend[index - 1].usage ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">{day.usage.toLocaleString()} 토큰</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 관리자용 사용자별 분석 */}
      {isAdmin && analyticsData.userStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자별 사용량
            </CardTitle>
            <CardDescription>
              개별 사용자의 토큰 사용량 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.userStats
                .sort((a, b) => b.usage - a.usage)
                .map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.userId.slice(0, 8)}...</Badge>
                      <span className="text-sm text-muted-foreground">
                        {user.operations}개 작업
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{user.usage.toLocaleString()} 토큰</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((user.usage / analyticsData.totalUsage) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground text-center">
          마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );
}
