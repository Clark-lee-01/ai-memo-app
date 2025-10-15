// components/ui/token-usage-alert.tsx
// 토큰 사용량 경고 알림 컴포넌트
// 사용량 임계값 도달 시 사용자에게 알림을 표시
// 관련 파일: components/dashboard/token-usage-dashboard.tsx, lib/monitoring/tokenMonitor.ts

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  X, 
  Settings, 
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

// 경고 레벨 타입
type AlertLevel = 'warning' | 'critical' | 'info';

// 토큰 사용량 알림 인터페이스
interface TokenUsageAlertProps {
  level: AlertLevel;
  message: string;
  currentUsage: number;
  limit: number;
  timeFrame: 'daily' | 'hourly';
  onDismiss?: () => void;
  onViewDetails?: () => void;
  onOpenSettings?: () => void;
  showDetails?: boolean;
}

// 토큰 사용량 알림 컴포넌트
export default function TokenUsageAlert({
  level,
  message,
  currentUsage,
  limit,
  timeFrame,
  onDismiss,
  onViewDetails,
  onOpenSettings,
  showDetails = false,
}: TokenUsageAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // 사용률 계산
  const usagePercentage = Math.min((currentUsage / limit) * 100, 100);

  // 경고 레벨에 따른 스타일 설정
  const getAlertVariant = () => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  // 경고 레벨에 따른 아이콘 설정
  const getAlertIcon = () => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // 경고 레벨에 따른 배지 색상 설정
  const getBadgeVariant = () => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // 경고 레벨에 따른 배지 텍스트 설정
  const getBadgeText = () => {
    switch (level) {
      case 'critical':
        return '위험';
      case 'warning':
        return '경고';
      case 'info':
        return '정보';
      default:
        return '알림';
    }
  };

  // 시간 프레임에 따른 아이콘 설정
  const getTimeFrameIcon = () => {
    switch (timeFrame) {
      case 'daily':
        return <Clock className="h-4 w-4" />;
      case 'hourly':
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // 알림 닫기
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  // 자동 닫기 (5초 후)
  useEffect(() => {
    if (level === 'info') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [level]);

  // 이미 닫힌 경우 렌더링하지 않음
  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <Alert variant={getAlertVariant()} className="relative">
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon()}
        </div>

        {/* 메시지 내용 */}
        <div className="flex-1 space-y-2">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant()}>
                {getBadgeText()}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {getTimeFrameIcon()}
                <span>
                  {timeFrame === 'daily' ? '일일' : '시간당'} 사용량
                </span>
              </div>
            </div>
            
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 메시지 */}
          <AlertDescription className="text-sm">
            {message}
          </AlertDescription>

          {/* 상세 정보 */}
          {showDetails && (
            <div className="space-y-2">
              {/* 사용량 정보 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">현재 사용량:</span>
                <span className="font-medium">
                  {currentUsage.toLocaleString()} / {limit.toLocaleString()} 토큰
                </span>
              </div>
              
              {/* 사용률 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">사용률:</span>
                <span className="font-medium">
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              
              {/* 남은 사용량 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">남은 사용량:</span>
                <span className="font-medium">
                  {Math.max(0, limit - currentUsage).toLocaleString()} 토큰
                </span>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 pt-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="h-8"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                상세 보기
              </Button>
            )}
            
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="h-8"
              >
                <Settings className="h-4 w-4 mr-1" />
                설정 변경
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

// 토큰 사용량 알림 훅
export function useTokenUsageAlert() {
  const [alerts, setAlerts] = useState<TokenUsageAlertProps[]>([]);

  // 알림 추가
  const addAlert = (alert: Omit<TokenUsageAlertProps, 'onDismiss'>) => {
    const newAlert: TokenUsageAlertProps = {
      ...alert,
      onDismiss: () => removeAlert(alert.message),
    };
    
    setAlerts(prev => [...prev, newAlert]);
  };

  // 알림 제거
  const removeAlert = (message: string) => {
    setAlerts(prev => prev.filter(alert => alert.message !== message));
  };

  // 모든 알림 제거
  const clearAlerts = () => {
    setAlerts([]);
  };

  // 경고 알림 추가
  const addWarningAlert = (
    message: string,
    currentUsage: number,
    limit: number,
    timeFrame: 'daily' | 'hourly'
  ) => {
    addAlert({
      level: 'warning',
      message,
      currentUsage,
      limit,
      timeFrame,
      showDetails: true,
    });
  };

  // 위험 알림 추가
  const addCriticalAlert = (
    message: string,
    currentUsage: number,
    limit: number,
    timeFrame: 'daily' | 'hourly'
  ) => {
    addAlert({
      level: 'critical',
      message,
      currentUsage,
      limit,
      timeFrame,
      showDetails: true,
    });
  };

  // 정보 알림 추가
  const addInfoAlert = (message: string) => {
    addAlert({
      level: 'info',
      message,
      currentUsage: 0,
      limit: 0,
      timeFrame: 'daily',
      showDetails: false,
    });
  };

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    addWarningAlert,
    addCriticalAlert,
    addInfoAlert,
  };
}
