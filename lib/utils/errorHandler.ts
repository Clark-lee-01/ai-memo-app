// lib/utils/errorHandler.ts
// 에러 핸들링 유틸리티 - 에러 감지, 분류, 복구 메커니즘
// AI 메모장 프로젝트의 에러 처리 시스템

import { AuthError, AIError, ErrorCategory, ErrorSeverity, ErrorContext, ErrorRecoveryOptions, SUPABASE_AUTH_ERRORS, SupabaseAuthErrorCode, AI_ERRORS, AIErrorCode } from '@/lib/types/errors';

export type { AuthError, AIError, ErrorCategory, ErrorSeverity, ErrorContext, ErrorRecoveryOptions };

export function classifyError(error: { name?: string; code?: string; message?: string; status?: number }, context: ErrorContext): AuthError {
  const timestamp = new Date();
  
  // AI 에러 처리 (우선순위)
  if (error?.name === 'GeminiAPIError' || error?.code) {
    const aiError = classifyAIError(error, context);
    if (aiError) return aiError;
  }
  
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
        retryAfter: 'retryAfter' in errorInfo ? errorInfo.retryAfter : undefined,
      };
    }
  }

  // 네트워크 에러 처리
  if (isNetworkError(error)) {
    return {
      code: 'network_error',
      message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
      category: 'system',
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

export function isNetworkError(error: { name?: string; code?: string; message?: string }): boolean {
  if (!error) return false;
  return (
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    (!!error.message && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    ))
  );
}

export function isServerError(error: { status?: number; code?: string; message?: string }): boolean {
  if (!error) return false;
  return (
    (typeof error.status === 'number' && error.status >= 500) ||
    (typeof error.code === 'string' && error.code.startsWith('5')) ||
    (!!error.message && (
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
        retry: true,
        maxRetries: 2,
        showRetryButton: true,
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

// AI 에러 분류 함수
export function classifyAIError(error: { name?: string; code?: string; message?: string; status?: number }, context: ErrorContext): AIError | null {
  const timestamp = new Date();
  
  // Gemini API 에러 코드 매핑
  const errorCode = extractAIErrorCode(error);
  if (errorCode && errorCode in AI_ERRORS) {
    const errorInfo = AI_ERRORS[errorCode as AIErrorCode];
    return {
      code: errorCode,
      message: errorInfo.message,
      category: errorInfo.category as 'ai' | 'api' | 'token' | 'data' | 'system',
      severity: errorInfo.severity,
      originalError: error,
      timestamp,
      userId: context.userId,
      retryable: errorInfo.retryable,
      retryAfter: 'retryAfter' in errorInfo ? errorInfo.retryAfter : undefined,
      apiEndpoint: context.action,
      retryCount: 0,
    };
  }
  
  // HTTP 상태 코드 기반 분류
  if (error.status) {
    return classifyByStatusCode(error, context);
  }
  
  // 에러 메시지 패턴 기반 분류
  if (error.message) {
    return classifyByMessagePattern(error, context);
  }
  
  return null;
}

// AI 에러 코드 추출
export function extractAIErrorCode(error: { code?: string; message?: string }): string | null {
  if (!error) return null;
  
  // Gemini API 에러 코드 패턴
  const patterns = [
    { pattern: /API key.*invalid/i, code: 'api_key_invalid' },
    { pattern: /API key.*expired/i, code: 'api_key_expired' },
    { pattern: /token.*limit.*exceeded/i, code: 'token_limit_exceeded' },
    { pattern: /rate.*limit.*exceeded/i, code: 'rate_limit_exceeded' },
    { pattern: /timeout/i, code: 'api_timeout' },
    { pattern: /server.*error/i, code: 'api_server_error' },
    { pattern: /quota.*exceeded/i, code: 'api_quota_exceeded' },
    { pattern: /invalid.*response/i, code: 'invalid_response_format' },
    { pattern: /content.*filtered/i, code: 'content_filtered' },
    { pattern: /model.*unavailable/i, code: 'model_unavailable' },
    { pattern: /network.*connection/i, code: 'network_connection_failed' },
    { pattern: /dns.*resolution/i, code: 'dns_resolution_failed' },
    { pattern: /ssl.*certificate/i, code: 'ssl_certificate_error' },
    { pattern: /memory.*insufficient/i, code: 'memory_insufficient' },
    { pattern: /file.*system/i, code: 'file_system_error' },
  ];
  
  for (const { pattern, code } of patterns) {
    if (pattern.test(error.message || '')) {
      return code;
    }
  }
  
  return null;
}

// HTTP 상태 코드 기반 분류
function classifyByStatusCode(error: { status?: number; message?: string }, context: ErrorContext): AIError | null {
  const timestamp = new Date();
  const statusCode = error.status;
  
  switch (statusCode) {
    case 400:
      return {
        code: 'invalid_request',
        message: '잘못된 요청입니다. 입력 데이터를 확인해주세요.',
        category: 'api',
        severity: 'error',
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: false,
        apiEndpoint: context.action,
        retryCount: 0,
      };
      
    case 401:
      return {
        code: 'api_key_invalid',
        message: 'API 키가 유효하지 않습니다. 관리자에게 문의해주세요.',
        category: 'api',
        severity: 'critical',
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: false,
        apiEndpoint: context.action,
        retryCount: 0,
      };
      
    case 403:
      return {
        code: 'api_quota_exceeded',
        message: 'API 사용 한도를 초과했습니다. 내일 다시 시도해주세요.',
        category: 'api',
        severity: 'error',
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: false,
        apiEndpoint: context.action,
        retryCount: 0,
      };
      
    case 429:
      return {
        code: 'rate_limit_exceeded',
        message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        category: 'api',
        severity: 'warning',
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: true,
        retryAfter: 60000,
        apiEndpoint: context.action,
        retryCount: 0,
      };
      
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: 'api_server_error',
        message: 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        category: 'system',
        severity: 'critical',
        originalError: error,
        timestamp,
        userId: context.userId,
        retryable: true,
        retryAfter: 10000,
        apiEndpoint: context.action,
        retryCount: 0,
      };
      
    default:
      return null;
  }
}

// 에러 메시지 패턴 기반 분류
function classifyByMessagePattern(error: { message?: string }, context: ErrorContext): AIError | null {
  const timestamp = new Date();
  const message = error.message || '';
  
  if (message.includes('network') || message.includes('connection')) {
    return {
      code: 'network_connection_failed',
      message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
      category: 'system',
      severity: 'error',
      originalError: error,
      timestamp,
      userId: context.userId,
      retryable: true,
      retryAfter: 5000,
      apiEndpoint: context.action,
      retryCount: 0,
    };
  }
  
  if (message.includes('timeout')) {
    return {
      code: 'api_timeout',
      message: 'API 응답 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.',
      category: 'system',
      severity: 'error',
      originalError: error,
      timestamp,
      userId: context.userId,
      retryable: true,
      retryAfter: 5000,
      apiEndpoint: context.action,
      retryCount: 0,
    };
  }
  
  return null;
}
