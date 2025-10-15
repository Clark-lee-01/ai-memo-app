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
  | 'ai'
  | 'api'
  | 'token'
  | 'data'
  | 'system'
  | 'unknown';

export interface AuthError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: unknown;
  timestamp: Date;
  userId?: string;
  retryable: boolean;
  retryAfter?: number; // milliseconds
}

// AI 관련 에러 타입
export interface AIError extends AuthError {
  category: 'ai' | 'api' | 'token' | 'data' | 'system';
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
    limit: number;
  };
  apiEndpoint?: string;
  retryCount?: number;
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

// AI 관련 에러 코드 매핑
export const AI_ERRORS = {
  'api_key_invalid': {
    message: 'API 키가 유효하지 않습니다. 관리자에게 문의해주세요.',
    category: 'api' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: false,
  },
  'api_key_expired': {
    message: 'API 키가 만료되었습니다. 관리자에게 문의해주세요.',
    category: 'api' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: false,
  },
  'token_limit_exceeded': {
    message: '토큰 사용량이 초과되었습니다. 텍스트를 줄여서 다시 시도해주세요.',
    category: 'token' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: false,
  },
  'rate_limit_exceeded': {
    message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    category: 'api' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: true,
    retryAfter: 60000, // 1분
  },
  'api_timeout': {
    message: 'API 응답 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.',
    category: 'network' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: true,
    retryAfter: 5000, // 5초
  },
  'api_server_error': {
    message: 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    category: 'server' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: true,
    retryAfter: 10000, // 10초
  },
  'api_quota_exceeded': {
    message: 'API 사용 한도를 초과했습니다. 내일 다시 시도해주세요.',
    category: 'api' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: false,
  },
  'invalid_response_format': {
    message: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.',
    category: 'data' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: true,
    retryAfter: 2000, // 2초
  },
  'content_filtered': {
    message: '내용이 정책에 위배되어 처리할 수 없습니다. 다른 내용으로 시도해주세요.',
    category: 'ai' as ErrorCategory,
    severity: 'warning' as ErrorSeverity,
    retryable: false,
  },
  'model_unavailable': {
    message: 'AI 모델이 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
    category: 'ai' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: true,
    retryAfter: 30000, // 30초
  },
  'network_connection_failed': {
    message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
    category: 'network' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: true,
    retryAfter: 5000, // 5초
  },
  'dns_resolution_failed': {
    message: '도메인 이름을 해석할 수 없습니다. 네트워크 설정을 확인해주세요.',
    category: 'network' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: true,
    retryAfter: 10000, // 10초
  },
  'ssl_certificate_error': {
    message: '보안 인증서에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
    category: 'network' as ErrorCategory,
    severity: 'error' as ErrorSeverity,
    retryable: true,
    retryAfter: 15000, // 15초
  },
  'memory_insufficient': {
    message: '시스템 메모리가 부족합니다. 다른 작업을 종료하고 다시 시도해주세요.',
    category: 'system' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: false,
  },
  'file_system_error': {
    message: '파일 시스템에 문제가 발생했습니다. 관리자에게 문의해주세요.',
    category: 'system' as ErrorCategory,
    severity: 'critical' as ErrorSeverity,
    retryable: false,
  },
} as const;

export type AIErrorCode = keyof typeof AI_ERRORS;
