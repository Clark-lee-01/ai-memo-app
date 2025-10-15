// lib/monitoring/tokenMonitor.ts
// 토큰 사용량 모니터링 시스템
// AI API 호출 시 토큰 사용량을 추적하고 제한 관리
// 관련 파일: lib/ai/gemini.ts, lib/types/errors.ts

import { AIError } from '@/lib/types/errors';

// 토큰 사용량 인터페이스
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  timestamp: Date;
  operation: string;
  userId?: string;
}

// 토큰 제한 설정
export interface TokenLimits {
  daily: number;
  hourly: number;
  perRequest: number;
  warningThreshold: number; // 경고 임계값 (0-1)
}

// 기본 토큰 제한 설정
const DEFAULT_LIMITS: TokenLimits = {
  daily: 100000, // 일일 100k 토큰
  hourly: 10000, // 시간당 10k 토큰
  perRequest: 8000, // 요청당 8k 토큰
  warningThreshold: 0.8, // 80% 사용 시 경고
};

// 토큰 사용량 저장소 (실제 환경에서는 데이터베이스 사용)
export class TokenUsageStore {
  private usage: TokenUsage[] = [];
  private limits: TokenLimits = DEFAULT_LIMITS;
  
  // 토큰 사용량 기록
  recordUsage(usage: Omit<TokenUsage, 'timestamp'>): void {
    const tokenUsage: TokenUsage = {
      ...usage,
      timestamp: new Date(),
    };
    
    this.usage.push(tokenUsage);
    
    // 오래된 기록 정리 (7일 이상)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.usage = this.usage.filter(u => u.timestamp > sevenDaysAgo);
  }
  
  // 일일 토큰 사용량 조회
  getDailyUsage(userId?: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.usage
      .filter(u => {
        const isToday = u.timestamp >= today;
        const isUser = !userId || u.userId === userId;
        return isToday && isUser;
      })
      .reduce((sum, u) => sum + u.total, 0);
  }
  
  // 시간당 토큰 사용량 조회
  getHourlyUsage(userId?: string): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return this.usage
      .filter(u => {
        const isRecent = u.timestamp >= oneHourAgo;
        const isUser = !userId || u.userId === userId;
        return isRecent && isUser;
      })
      .reduce((sum, u) => sum + u.total, 0);
  }
  
  // 토큰 제한 확인
  checkLimits(userId?: string): {
    canProceed: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    const dailyUsage = this.getDailyUsage(userId);
    const hourlyUsage = this.getHourlyUsage(userId);
    
    // 일일 제한 확인
    if (dailyUsage >= this.limits.daily) {
      errors.push(`일일 토큰 사용량이 초과되었습니다 (${dailyUsage}/${this.limits.daily})`);
    } else if (dailyUsage >= this.limits.daily * this.limits.warningThreshold) {
      warnings.push(`일일 토큰 사용량이 ${Math.round(this.limits.warningThreshold * 100)}%에 도달했습니다 (${dailyUsage}/${this.limits.daily})`);
    }
    
    // 시간당 제한 확인
    if (hourlyUsage >= this.limits.hourly) {
      errors.push(`시간당 토큰 사용량이 초과되었습니다 (${hourlyUsage}/${this.limits.hourly})`);
    } else if (hourlyUsage >= this.limits.hourly * this.limits.warningThreshold) {
      warnings.push(`시간당 토큰 사용량이 ${Math.round(this.limits.warningThreshold * 100)}%에 도달했습니다 (${hourlyUsage}/${this.limits.hourly})`);
    }
    
    return {
      canProceed: errors.length === 0,
      warnings,
      errors,
    };
  }
  
  // 토큰 제한 설정 업데이트
  updateLimits(limits: Partial<TokenLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }
  
  // 사용량 통계 조회
  getUsageStats(userId?: string, days: number = 7): {
    totalUsage: number;
    averageDaily: number;
    peakHourly: number;
    operations: { [key: string]: number };
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentUsage = this.usage.filter(u => {
      const isRecent = u.timestamp >= cutoffDate;
      const isUser = !userId || u.userId === userId;
      return isRecent && isUser;
    });
    
    const totalUsage = recentUsage.reduce((sum, u) => sum + u.total, 0);
    const averageDaily = totalUsage / days;
    
    // 시간별 사용량 계산
    const hourlyUsage: { [key: string]: number } = {};
    recentUsage.forEach(u => {
      const hour = u.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + u.total;
    });
    
    const peakHourly = Math.max(...Object.values(hourlyUsage), 0);
    
    // 작업별 사용량 계산
    const operations: { [key: string]: number } = {};
    recentUsage.forEach(u => {
      operations[u.operation] = (operations[u.operation] || 0) + u.total;
    });
    
    return {
      totalUsage,
      averageDaily,
      peakHourly,
      operations,
    };
  }
}

// 전역 토큰 사용량 저장소
const tokenStore = new TokenUsageStore();

// 토큰 모니터링 클래스
export class TokenMonitor {
  private store: TokenUsageStore;
  
  constructor(store: TokenUsageStore = tokenStore) {
    this.store = store;
  }
  
  // 토큰 사용량 기록
  recordUsage(usage: Omit<TokenUsage, 'timestamp'>): void {
    this.store.recordUsage(usage);
  }
  
  // 요청 전 토큰 제한 확인
  validateRequest(
    estimatedTokens: number, 
    userId?: string
  ): { 
    allowed: boolean; 
    error?: AIError;
    warnings: string[];
  } {
    // 요청당 토큰 제한 확인
    if (estimatedTokens > this.store['limits'].perRequest) {
      const error: AIError = {
        code: 'token_limit_exceeded',
        message: `요청당 토큰 제한을 초과했습니다. 최대 ${this.store['limits'].perRequest} 토큰까지 사용 가능합니다.`,
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        userId,
        retryable: false,
        tokenUsage: {
          input: estimatedTokens,
          output: 0,
          total: estimatedTokens,
          limit: this.store['limits'].perRequest,
        },
      };
      
      return {
        allowed: false,
        error,
        warnings: [],
      };
    }
    
    // 전체 제한 확인
    const limitCheck = this.store.checkLimits(userId);
    
    if (!limitCheck.canProceed) {
      const error: AIError = {
        code: 'token_limit_exceeded',
        message: limitCheck.errors.join(' '),
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        userId,
        retryable: false,
        tokenUsage: {
          input: estimatedTokens,
          output: 0,
          total: estimatedTokens,
          limit: this.store['limits'].daily,
        },
      };
      
      return {
        allowed: false,
        error,
        warnings: limitCheck.warnings,
      };
    }
    
    return {
      allowed: true,
      warnings: limitCheck.warnings,
    };
  }
  
  // 토큰 사용량 조회
  getUsage(userId?: string): {
    daily: number;
    hourly: number;
    limits: TokenLimits;
    stats: ReturnType<TokenUsageStore['getUsageStats']>;
  } {
    return {
      daily: this.store.getDailyUsage(userId),
      hourly: this.store.getHourlyUsage(userId),
      limits: this.store['limits'],
      stats: this.store.getUsageStats(userId),
    };
  }
  
  // 토큰 제한 설정 업데이트
  updateLimits(limits: Partial<TokenLimits>): void {
    this.store.updateLimits(limits);
  }
  
  // 토큰 사용량 리셋 (관리자용)
  resetUsage(userId?: string): void {
    if (userId) {
      // 특정 사용자만 리셋
      this.store['usage'] = this.store['usage'].filter(u => u.userId !== userId);
    } else {
      // 전체 리셋
      this.store['usage'] = [];
    }
  }
}

// 전역 토큰 모니터 인스턴스
export const tokenMonitor = new TokenMonitor();

// 토큰 사용량 추적 데코레이터
export function trackTokenUsage(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[1]?.userId;
      
      // 요청 전 검증
      const validation = tokenMonitor.validateRequest(8000, userId); // 기본 8k 토큰 추정
      if (!validation.allowed) {
        throw validation.error;
      }
      
      try {
        const result = await method.apply(this, args);
        
        // 성공 시 토큰 사용량 기록 (실제 사용량이 있다면)
        if (result && typeof result === 'object' && result.tokenUsage) {
          tokenMonitor.recordUsage({
            ...result.tokenUsage,
            operation,
            userId,
          });
        }
        
        return result;
      } catch (error) {
        // 에러 발생 시에도 토큰 사용량 기록 (실패한 요청도 사용량에 포함)
        tokenMonitor.recordUsage({
          input: 8000, // 추정값
          output: 0,
          total: 8000,
          operation,
          userId,
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}
