// lib/hooks/useTokenMonitoring.ts
// 토큰 사용량 모니터링 훅
// 실시간 토큰 사용량 추적 및 경고 관리
// 관련 파일: components/dashboard/token-usage-dashboard.tsx, lib/monitoring/tokenMonitor.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTokenUsageAlert } from '@/components/ui/token-usage-alert';

// 토큰 사용량 데이터 인터페이스
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

// 토큰 모니터링 훅
export function useTokenMonitoring(userId?: string) {
  const [usageData, setUsageData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const {
    alerts,
    addWarningAlert,
    addCriticalAlert,
    clearAlerts,
  } = useTokenUsageAlert();

  // 사용량 데이터 로드
  const loadUsageData = useCallback(async () => {
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
      
      // 경고 알림 확인
      checkUsageAlerts(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 사용량 경고 확인
  const checkUsageAlerts = useCallback((data: TokenUsageData) => {
    const { daily, hourly, limits } = data;
    const warningThreshold = limits.warningThreshold;
    
    // 일일 사용량 경고 확인
    if (daily >= limits.daily) {
      addCriticalAlert(
        `일일 토큰 사용량이 초과되었습니다 (${daily.toLocaleString()}/${limits.daily.toLocaleString()})`,
        daily,
        limits.daily,
        'daily'
      );
    } else if (daily >= limits.daily * warningThreshold) {
      addWarningAlert(
        `일일 토큰 사용량이 ${Math.round(warningThreshold * 100)}%에 도달했습니다 (${daily.toLocaleString()}/${limits.daily.toLocaleString()})`,
        daily,
        limits.daily,
        'daily'
      );
    }
    
    // 시간당 사용량 경고 확인
    if (hourly >= limits.hourly) {
      addCriticalAlert(
        `시간당 토큰 사용량이 초과되었습니다 (${hourly.toLocaleString()}/${limits.hourly.toLocaleString()})`,
        hourly,
        limits.hourly,
        'hourly'
      );
    } else if (hourly >= limits.hourly * warningThreshold) {
      addWarningAlert(
        `시간당 토큰 사용량이 ${Math.round(warningThreshold * 100)}%에 도달했습니다 (${hourly.toLocaleString()}/${limits.hourly.toLocaleString()})`,
        hourly,
        limits.hourly,
        'hourly'
      );
    }
  }, [addWarningAlert, addCriticalAlert]);

  // 토큰 사용량 기록
  const recordUsage = useCallback(async (
    input: number,
    output: number,
    operation: string
  ) => {
    try {
      const response = await fetch('/api/token-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          output,
          operation,
        }),
      });

      if (!response.ok) {
        throw new Error('토큰 사용량을 기록할 수 없습니다');
      }

      // 사용량 데이터 새로고침
      await loadUsageData();
      
    } catch (err) {
      console.error('토큰 사용량 기록 오류:', err);
    }
  }, [loadUsageData]);

  // 토큰 제한 설정 업데이트
  const updateLimits = useCallback(async (limits: Partial<TokenUsageData['limits']>) => {
    try {
      const response = await fetch('/api/token-usage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limits),
      });

      if (!response.ok) {
        throw new Error('토큰 제한 설정을 업데이트할 수 없습니다');
      }

      // 사용량 데이터 새로고침
      await loadUsageData();
      
    } catch (err) {
      console.error('토큰 제한 설정 업데이트 오류:', err);
    }
  }, [loadUsageData]);

  // 사용률 계산
  const getUsagePercentage = useCallback((current: number, limit: number): number => {
    return Math.min((current / limit) * 100, 100);
  }, []);

  // 경고 레벨 계산
  const getWarningLevel = useCallback((): 'none' | 'warning' | 'critical' => {
    if (!usageData) return 'none';
    
    const { daily, limits } = usageData;
    const warningThreshold = limits.warningThreshold;
    
    if (daily >= limits.daily) return 'critical';
    if (daily >= limits.daily * warningThreshold) return 'warning';
    return 'none';
  }, [usageData]);

  // 사용 가능 여부 확인
  const canUseAI = useCallback((): boolean => {
    if (!usageData) return true;
    
    const { daily, hourly, limits } = usageData;
    
    return daily < limits.daily && hourly < limits.hourly;
  }, [usageData]);

  // 남은 사용량 계산
  const getRemainingUsage = useCallback(() => {
    if (!usageData) return { daily: 0, hourly: 0 };
    
    const { daily, hourly, limits } = usageData;
    
    return {
      daily: Math.max(0, limits.daily - daily),
      hourly: Math.max(0, limits.hourly - hourly),
    };
  }, [usageData]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(loadUsageData, 30000);
    return () => clearInterval(interval);
  }, [loadUsageData]);

  return {
    // 데이터
    usageData,
    loading,
    error,
    lastUpdated,
    alerts,
    
    // 액션
    loadUsageData,
    recordUsage,
    updateLimits,
    clearAlerts,
    
    // 계산된 값
    getUsagePercentage,
    getWarningLevel,
    canUseAI,
    getRemainingUsage,
  };
}
