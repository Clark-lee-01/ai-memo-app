// lib/monitoring/errorLogger.ts
// 에러 로깅 및 모니터링 시스템
// AI 처리 에러를 구조화하여 기록하고 분석
// 관련 파일: lib/types/errors.ts, lib/utils/errorHandler.ts

import { AIError, ErrorSeverity, ErrorCategory } from '@/lib/types/errors';

// 에러 로그 인터페이스
export interface ErrorLog {
  id: string;
  error: AIError;
  context: {
    userId?: string;
    action?: string;
    component?: string;
    url?: string;
    userAgent?: string;
    timestamp: Date;
  };
  metadata: {
    sessionId?: string;
    requestId?: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
  };
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// 에러 통계 인터페이스
export interface ErrorStats {
  total: number;
  byCategory: { [key in ErrorCategory]: number };
  bySeverity: { [key in ErrorSeverity]: number };
  byCode: { [key: string]: number };
  byUser: { [key: string]: number };
  byComponent: { [key: string]: number };
  timeRange: {
    start: Date;
    end: Date;
  };
  trends: {
    hourly: { [key: string]: number };
    daily: { [key: string]: number };
  };
}

// 에러 알림 설정
export interface ErrorAlert {
  id: string;
  name: string;
  conditions: {
    category?: ErrorCategory[];
    severity?: ErrorSeverity[];
    code?: string[];
    threshold?: number; // 시간당 발생 횟수
  };
  channels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
  enabled: boolean;
  lastTriggered?: Date;
}

// 에러 로그 저장소 (실제 환경에서는 데이터베이스 사용)
export class ErrorLogStore {
  private logs: ErrorLog[] = [];
  private alerts: ErrorAlert[] = [];
  
  // 에러 로그 저장
  addLog(log: Omit<ErrorLog, 'id'>): string {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorLog: ErrorLog = {
      ...log,
      id,
    };
    
    this.logs.push(errorLog);
    
    // 오래된 로그 정리 (30일 이상)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(l => l.context.timestamp > thirtyDaysAgo);
    
    // 알림 확인
    this.checkAlerts(errorLog);
    
    return id;
  }
  
  // 에러 로그 조회
  getLogs(filters?: {
    userId?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    code?: string;
    component?: string;
    startDate?: Date;
    endDate?: Date;
    resolved?: boolean;
  }): ErrorLog[] {
    let filteredLogs = [...this.logs];
    
    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(l => l.context.userId === filters.userId);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(l => l.error.category === filters.category);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(l => l.error.severity === filters.severity);
      }
      if (filters.code) {
        filteredLogs = filteredLogs.filter(l => l.error.code === filters.code);
      }
      if (filters.component) {
        filteredLogs = filteredLogs.filter(l => l.context.component === filters.component);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(l => l.context.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(l => l.context.timestamp <= filters.endDate!);
      }
      if (filters.resolved !== undefined) {
        filteredLogs = filteredLogs.filter(l => l.resolved === filters.resolved);
      }
    }
    
    return filteredLogs.sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime());
  }
  
  // 에러 통계 생성
  getStats(timeRange?: { start: Date; end: Date }): ErrorStats {
    const start = timeRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000); // 기본 24시간
    const end = timeRange?.end || new Date();
    
    const logs = this.logs.filter(l => 
      l.context.timestamp >= start && l.context.timestamp <= end
    );
    
    const byCategory: { [key in ErrorCategory]: number } = {
      network: 0,
      authentication: 0,
      authorization: 0,
      server: 0,
      client: 0,
      session: 0,
      validation: 0,
      ai: 0,
      api: 0,
      token: 0,
      data: 0,
      system: 0,
      unknown: 0,
    };
    
    const bySeverity: { [key in ErrorSeverity]: number } = {
      warning: 0,
      error: 0,
      critical: 0,
    };
    
    const byCode: { [key: string]: number } = {};
    const byUser: { [key: string]: number } = {};
    const byComponent: { [key: string]: number } = {};
    
    logs.forEach(log => {
      byCategory[log.error.category]++;
      bySeverity[log.error.severity]++;
      byCode[log.error.code] = (byCode[log.error.code] || 0) + 1;
      
      if (log.context.userId) {
        byUser[log.context.userId] = (byUser[log.context.userId] || 0) + 1;
      }
      
      if (log.context.component) {
        byComponent[log.context.component] = (byComponent[log.context.component] || 0) + 1;
      }
    });
    
    // 시간별 트렌드 계산
    const hourly: { [key: string]: number } = {};
    const daily: { [key: string]: number } = {};
    
    logs.forEach(log => {
      const hour = log.context.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const day = log.context.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
      
      hourly[hour] = (hourly[hour] || 0) + 1;
      daily[day] = (daily[day] || 0) + 1;
    });
    
    return {
      total: logs.length,
      byCategory,
      bySeverity,
      byCode,
      byUser,
      byComponent,
      timeRange: { start, end },
      trends: { hourly, daily },
    };
  }
  
  // 에러 해결 표시
  resolveError(id: string, resolvedBy: string): boolean {
    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.resolved = true;
      log.resolvedAt = new Date();
      log.resolvedBy = resolvedBy;
      return true;
    }
    return false;
  }
  
  // 알림 설정 추가
  addAlert(alert: Omit<ErrorAlert, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorAlert: ErrorAlert = {
      ...alert,
      id,
    };
    
    this.alerts.push(errorAlert);
    return id;
  }
  
  // 알림 확인
  private checkAlerts(log: ErrorLog): void {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return;
      
      const conditions = alert.conditions;
      let shouldTrigger = true;
      
      // 카테고리 조건 확인
      if (conditions.category && !conditions.category.includes(log.error.category)) {
        shouldTrigger = false;
      }
      
      // 심각도 조건 확인
      if (conditions.severity && !conditions.severity.includes(log.error.severity)) {
        shouldTrigger = false;
      }
      
      // 코드 조건 확인
      if (conditions.code && !conditions.code.includes(log.error.code)) {
        shouldTrigger = false;
      }
      
      // 임계값 조건 확인
      if (conditions.threshold) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentLogs = this.logs.filter(l => 
          l.context.timestamp >= oneHourAgo &&
          l.error.code === log.error.code
        );
        
        if (recentLogs.length < conditions.threshold) {
          shouldTrigger = false;
        }
      }
      
      if (shouldTrigger) {
        this.triggerAlert(alert, log);
      }
    });
  }
  
  // 알림 트리거
  private triggerAlert(alert: ErrorAlert, log: ErrorLog): void {
    // 중복 알림 방지 (1시간 내 동일한 알림은 트리거하지 않음)
    if (alert.lastTriggered) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (alert.lastTriggered > oneHourAgo) {
        return;
      }
    }
    
    alert.lastTriggered = new Date();
    
    // 실제 환경에서는 이메일, 슬랙, 웹훅 등으로 알림 전송
    console.warn('🚨 Error Alert Triggered:', {
      alertId: alert.id,
      alertName: alert.name,
      errorCode: log.error.code,
      errorMessage: log.error.message,
      severity: log.error.severity,
      category: log.error.category,
      userId: log.context.userId,
      component: log.context.component,
      timestamp: log.context.timestamp,
    });
    
    // TODO: 실제 알림 전송 구현
    // sendEmailAlert(alert, log);
    // sendSlackAlert(alert, log);
    // sendWebhookAlert(alert, log);
  }
}

// 전역 에러 로그 저장소
const errorStore = new ErrorLogStore();

// 에러 로거 클래스
export class ErrorLogger {
  private store: ErrorLogStore;
  private environment: 'development' | 'staging' | 'production';
  private version: string;
  
  constructor(
    store: ErrorLogStore = errorStore,
    environment: 'development' | 'staging' | 'production' = 'development',
    version: string = '1.0.0'
  ) {
    this.store = store;
    this.environment = environment;
    this.version = version;
  }
  
  // 에러 로그 기록
  logError(
    error: AIError,
    context: {
      userId?: string;
      action?: string;
      component?: string;
      url?: string;
      userAgent?: string;
    },
    metadata?: {
      sessionId?: string;
      requestId?: string;
    }
  ): string {
    const log: Omit<ErrorLog, 'id'> = {
      error,
      context: {
        ...context,
        timestamp: new Date(),
      },
      metadata: {
        ...metadata,
        environment: this.environment,
        version: this.version,
      },
      resolved: false,
    };
    
    return this.store.addLog(log);
  }
  
  // 에러 로그 조회
  getLogs(filters?: Parameters<ErrorLogStore['getLogs']>[0]): ErrorLog[] {
    return this.store.getLogs(filters);
  }
  
  // 에러 통계 조회
  getStats(timeRange?: { start: Date; end: Date }): ErrorStats {
    return this.store.getStats(timeRange);
  }
  
  // 에러 해결 표시
  resolveError(id: string, resolvedBy: string): boolean {
    return this.store.resolveError(id, resolvedBy);
  }
  
  // 알림 설정 추가
  addAlert(alert: Omit<ErrorAlert, 'id'>): string {
    return this.store.addAlert(alert);
  }
  
  // 심각한 에러 자동 알림 설정
  setupCriticalErrorAlerts(): void {
    // API 키 관련 에러 알림
    this.addAlert({
      name: 'API Key Errors',
      conditions: {
        code: ['api_key_invalid', 'api_key_expired'],
        severity: ['critical'],
      },
      channels: ['email', 'slack'],
      recipients: ['admin@example.com'],
      enabled: true,
    });
    
    // 시스템 에러 알림
    this.addAlert({
      name: 'System Errors',
      conditions: {
        category: ['system'],
        severity: ['critical'],
      },
      channels: ['email', 'slack'],
      recipients: ['admin@example.com'],
      enabled: true,
    });
    
    // 높은 에러 발생률 알림
    this.addAlert({
      name: 'High Error Rate',
      conditions: {
        threshold: 10, // 시간당 10회 이상
      },
      channels: ['slack'],
      recipients: ['#alerts'],
      enabled: true,
    });
  }
}

// 전역 에러 로거 인스턴스
export const errorLogger = new ErrorLogger();

// 에러 로깅 헬퍼 함수
export function logAIError(
  error: AIError,
  context: {
    userId?: string;
    action?: string;
    component?: string;
  }
): string {
  return errorLogger.logError(error, {
    ...context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  });
}
