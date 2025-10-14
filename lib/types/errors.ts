// lib/types/errors.ts
// 에러 타입 정의 - 인증 에러 분류 및 타입 정의
// AI 메모장 프로젝트의 에러 처리 타입 안전성 보장

export type ErrorSeverity = 'warning' | 'error' | 'critical';

export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'client'
  | 'session'
  | 'validation'
  | 'unknown';

export interface AuthError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: Error;
  timestamp: Date;
  userId?: string;
  retryable: boolean;
  retryAfter?: number; // milliseconds
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ErrorRecoveryOptions {
  retry: boolean;
  retryCount: number;
  maxRetries: number;
  fallbackAction?: string;
  showRetryButton: boolean;
  showFallbackButton: boolean;
}

// Supabase Auth 에러 코드 매핑
export const SUPABASE_AUTH_ERRORS = {
  'invalid_credentials': {
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    category: 'authentication' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: false,
  },
  'email_not_confirmed': {
    message: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
    category: 'authentication' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: false,
  },
  'too_many_requests': {
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    category: 'client' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: true,
    retryAfter: 60000, // 1분
  },
  'weak_password': {
    message: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.',
    category: 'validation' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: false,
  },
  'user_not_found': {
    message: '사용자를 찾을 수 없습니다.',
    category: 'authentication' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: false,
  },
  'invalid_token': {
    message: '세션이 만료되었습니다. 다시 로그인해주세요.',
    category: 'session' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: false,
  },
  'network_error': {
    message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
    category: 'network' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: true,
    retryAfter: 5000, // 5초
  },
  'server_error': {
    message: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    category: 'server' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: true,
    retryAfter: 10000, // 10초
  },
} as const;

export type SupabaseAuthErrorCode = keyof typeof SUPABASE_AUTH_ERRORS;
