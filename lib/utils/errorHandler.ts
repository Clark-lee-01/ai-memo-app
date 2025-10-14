// lib/utils/errorHandler.ts
// 에러 핸들링 유틸리티 - 에러 감지, 분류, 복구 메커니즘
// AI 메모장 프로젝트의 에러 처리 시스템

import { AuthError, ErrorCategory, ErrorSeverity, ErrorContext, ErrorRecoveryOptions, SUPABASE_AUTH_ERRORS, SupabaseAuthErrorCode } from '@/lib/types/errors';

export function classifyError(error: any, context: ErrorContext): AuthError {
  const timestamp = new Date();
  
  // Supabase Auth 에러 처리
  if (error?.message && typeof error.message === 'string') {
    const errorCode = extractSupabaseErrorCode(error.message);
    if (errorCode && errorCode in SUPABASE_AUTH_ERRORS) {
      const errorInfo = SUPABASE_AUTH_ERRORS[errorCode as SupabaseAuthErrorCode];
      return {
        code: errorCode,
        message: errorInfo.message,
        category: errorInfo.category,
        severity: errorInfo.severity,
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: errorInfo.retryable,
        retryAfter: errorInfo.retryAfter,
      };
    }
  }

  // 네트워크 에러 처리
  if (isNetworkError(error)) {
    return {
      code: 'network_error',
      message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
      category: 'network',
      severity: 'error',
      originalError: error,
      timestamp,
      userId: context.userId,
      retryable: true,
      retryAfter: 5000,
    };
  }

  // 서버 에러 처리
  if (isServerError(error)) {
    return {
      code: 'server_error',
      message: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      category: 'server',
      severity: 'critical',
      originalError: error,
      timestamp,
      userId: context.userId,
      retryable: true,
      retryAfter: 10000,
    };
  }

  // 알 수 없는 에러
  return {
    code: 'unknown_error',
    message: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    category: 'unknown',
    severity: 'error',
    originalError: error,
    timestamp,
    userId: context.userId,
    retryable: true,
    retryAfter: 5000,
  };
}

export function extractSupabaseErrorCode(message: string): string | null {
  // Supabase 에러 메시지에서 에러 코드 추출
  const patterns = [
    { pattern: /invalid.*credentials/i, code: 'invalid_credentials' },
    { pattern: /email.*not.*confirmed/i, code: 'email_not_confirmed' },
    { pattern: /too.*many.*requests/i, code: 'too_many_requests' },
    { pattern: /weak.*password/i, code: 'weak_password' },
    { pattern: /user.*not.*found/i, code: 'user_not_found' },
    { pattern: /invalid.*token/i, code: 'invalid_token' },
  ];

  for (const { pattern, code } of patterns) {
    if (pattern.test(message)) {
      return code;
    }
  }

  return null;
}

export function isNetworkError(error: any): boolean {
  if (!error) return false;
  return (
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    (error.message && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    ))
  );
}

export function isServerError(error: any): boolean {
  if (!error) return false;
  return (
    (typeof error.status === 'number' && error.status >= 500) ||
    (typeof error.code === 'string' && error.code.startsWith('5')) ||
    (error.message && (
      error.message.toLowerCase().includes('server') ||
      error.message.toLowerCase().includes('internal')
    ))
  );
}

export function isRetryableError(error: AuthError): boolean {
  return error.retryable && error.severity !== 'critical';
}

export function getRetryDelay(error: AuthError, attemptCount: number): number {
  if (!error.retryAfter) return 1000; // 기본 1초
  
  // 지수 백오프 적용
  return Math.min(error.retryAfter * Math.pow(2, attemptCount - 1), 30000); // 최대 30초
}

export function shouldRetry(error: AuthError, attemptCount: number, maxRetries: number = 3): boolean {
  if (!isRetryableError(error)) return false;
  if (attemptCount >= maxRetries) return false;
  if (error.severity === 'critical' && attemptCount >= 1) return false;
  
  return true;
}

export function getErrorRecoveryOptions(error: AuthError): ErrorRecoveryOptions {
  const baseOptions: ErrorRecoveryOptions = {
    retry: isRetryableError(error),
    retryCount: 0,
    maxRetries: 3,
    showRetryButton: isRetryableError(error),
    showFallbackButton: false,
  };

  switch (error.category) {
    case 'network':
      return {
        ...baseOptions,
        fallbackAction: '네트워크 설정 확인',
        showFallbackButton: true,
      };
    
    case 'session':
      return {
        ...baseOptions,
        retry: false,
        showRetryButton: false,
        fallbackAction: '다시 로그인',
        showFallbackButton: true,
      };
    
    case 'authentication':
      return {
        ...baseOptions,
        retry: false,
        showRetryButton: false,
        fallbackAction: '로그인 페이지로 이동',
        showFallbackButton: true,
      };
    
    case 'server':
      return {
        ...baseOptions,
        maxRetries: 2,
        fallbackAction: '잠시 후 다시 시도',
        showFallbackButton: true,
      };
    
    default:
      return baseOptions;
  }
}

export function logError(error: AuthError, context: ErrorContext): void {
  const logData = {
    code: error.code,
    message: error.message,
    category: error.category,
    severity: error.severity,
    userId: context.userId,
    action: context.action,
    component: context.component,
    url: context.url,
    timestamp: error.timestamp,
    retryable: error.retryable,
  };

  // 콘솔 로깅
  console.error('Auth Error:', logData);
  
  // TODO: 실제 로깅 서비스로 전송 (예: Sentry, LogRocket 등)
  // sendToLoggingService(logData);
}

export function createErrorContext(
  userId?: string,
  action?: string,
  component?: string
): ErrorContext {
  return {
    userId,
    action,
    component,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    timestamp: new Date(),
  };
}
