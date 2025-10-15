// components/ui/token-limit-guard.tsx
// 토큰 사용량 제한 가드 컴포넌트
// AI 기능 사용 전 토큰 제한을 확인하고 제한하는 컴포넌트
// 관련 파일: lib/middleware/tokenLimitMiddleware.ts, components/ui/token-usage-alert.tsx

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useTokenMonitoring } from '@/lib/hooks/useTokenMonitoring';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Lock, 
  Unlock, 
  BarChart3,
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react';

// 토큰 제한 가드 프로퍼티
interface TokenLimitGuardProps {
  children: ReactNode;
  estimatedTokens: number;
  operation: string;
  userId?: string;
  fallback?: ReactNode;
  showWarning?: boolean;
  onLimitExceeded?: () => void;
  onWarning?: (warnings: string[]) => void;
}

// 토큰 제한 가드 컴포넌트
export default function TokenLimitGuard({
  children,
  estimatedTokens,
  operation,
  userId,
  fallback,
  showWarning = true,
  onLimitExceeded,
  onWarning,
}: TokenLimitGuardProps) {
  const {
    usageData,
    loading,
    error,
    canUseAI,
    getUsagePercentage,
    getWarningLevel,
    getRemainingUsage,
    loadUsageData,
  } = useTokenMonitoring(userId);

  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  // 토큰 제한 확인
  const checkTokenLimit = async () => {
    if (!usageData) return false;
    
    setIsChecking(true);
    setCheckError(null);
    
    try {
      const response = await fetch('/api/token-usage/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimatedTokens,
          operation,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('토큰 제한을 확인할 수 없습니다');
      }

      const result = await response.json();
      
      if (!result.allowed) {
        onLimitExceeded?.();
        return false;
      }
      
      if (result.warnings && result.warnings.length > 0) {
        onWarning?.(result.warnings);
      }
      
      return true;
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // 컴포넌트 마운트 시 제한 확인
  useEffect(() => {
    if (usageData && !loading) {
      checkTokenLimit();
    }
  }, [usageData, loading, estimatedTokens, operation, userId]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">토큰 제한을 확인하는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error || checkError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || checkError}
        </AlertDescription>
      </Alert>
    );
  }

  // 데이터 없음
  if (!usageData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          토큰 사용량 데이터를 불러올 수 없습니다
        </AlertDescription>
      </Alert>
    );
  }

  // AI 사용 불가능
  if (!canUseAI()) {
    const remaining = getRemainingUsage();
    const warningLevel = getWarningLevel();
    
    return (
      <div className="space-y-4">
        {/* 제한 초과 알림 */}
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            토큰 사용량이 초과되어 AI 기능을 사용할 수 없습니다
          </AlertDescription>
        </Alert>

        {/* 사용량 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              현재 사용량
            </CardTitle>
            <CardDescription>
              토큰 사용량이 제한을 초과했습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 일일 사용량 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">일일 사용량</span>
                <Badge variant="destructive">
                  {usageData.daily.toLocaleString()} / {usageData.limits.daily.toLocaleString()}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usageData.daily, usageData.limits.daily)}%` }}
                />
              </div>
            </div>

            {/* 시간당 사용량 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">시간당 사용량</span>
                <Badge variant="destructive">
                  {usageData.hourly.toLocaleString()} / {usageData.limits.hourly.toLocaleString()}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full" 
                  style={{ width: `${getUsagePercentage(usageData.hourly, usageData.limits.hourly)}%` }}
                />
              </div>
            </div>

            {/* 남은 사용량 */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {remaining.daily.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">일일 남은 사용량</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {remaining.hourly.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">시간당 남은 사용량</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsageData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정 변경
          </Button>
        </div>

        {/* 폴백 UI */}
        {fallback}
      </div>
    );
  }

  // 경고 표시
  if (showWarning) {
    const warningLevel = getWarningLevel();
    const remaining = getRemainingUsage();
    
    if (warningLevel === 'warning') {
      return (
        <div className="space-y-4">
          {/* 경고 알림 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              토큰 사용량이 경고 수준에 도달했습니다. 사용량을 확인해주세요.
            </AlertDescription>
          </Alert>

          {/* 사용량 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                사용량 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 일일 사용량 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">일일 사용량</span>
                  <Badge variant="secondary">
                    {usageData.daily.toLocaleString()} / {usageData.limits.daily.toLocaleString()}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(usageData.daily, usageData.limits.daily)}%` }}
                  />
                </div>
              </div>

              {/* 남은 사용량 */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {remaining.daily.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">일일 남은 사용량</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {remaining.hourly.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">시간당 남은 사용량</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 자식 컴포넌트 */}
          {children}
        </div>
      );
    }
  }

  // 정상 상태 - 자식 컴포넌트 렌더링
  return <>{children}</>;
}

// 토큰 제한 상태 표시 컴포넌트
export function TokenLimitStatus({ userId }: { userId?: string }) {
  const {
    usageData,
    loading,
    canUseAI,
    getUsagePercentage,
    getWarningLevel,
    getRemainingUsage,
  } = useTokenMonitoring(userId);

  if (loading || !usageData) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  const warningLevel = getWarningLevel();
  const remaining = getRemainingUsage();
  const dailyPercentage = getUsagePercentage(usageData.daily, usageData.limits.daily);

  return (
    <div className="flex items-center gap-2">
      {canUseAI() ? (
        <Unlock className="h-4 w-4 text-green-500" />
      ) : (
        <Lock className="h-4 w-4 text-red-500" />
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">
          {usageData.daily.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">
          / {usageData.limits.daily.toLocaleString()}
        </span>
      </div>
      
      <Badge 
        variant={
          warningLevel === 'critical' ? 'destructive' : 
          warningLevel === 'warning' ? 'secondary' : 
          'outline'
        }
      >
        {Math.round(dailyPercentage)}%
      </Badge>
    </div>
  );
}
