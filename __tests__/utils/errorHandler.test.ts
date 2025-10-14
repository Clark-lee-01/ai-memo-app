// __tests__/utils/errorHandler.test.ts
// 에러 핸들링 유틸리티 테스트 - 에러 분류 및 처리 테스트
// AI 메모장 프로젝트의 에러 핸들링 테스트

import {
  classifyError,
  extractSupabaseErrorCode,
  isNetworkError,
  isServerError,
  isRetryableError,
  getRetryDelay,
  shouldRetry,
  getErrorRecoveryOptions,
  createErrorContext,
} from '@/lib/utils/errorHandler';
import { AuthError, ErrorContext } from '@/lib/types/errors';

describe('Error Handler Utilities', () => {
  describe('classifyError', () => {
    it('should classify Supabase auth errors correctly', () => {
      const error = new Error('Invalid login credentials');
      const context: ErrorContext = {
        userId: 'test-user',
        action: 'signin',
        component: 'SignInForm',
        timestamp: new Date(),
      };

      const result = classifyError(error, context);

      expect(result.code).toBe('invalid_credentials');
      expect(result.category).toBe('authentication');
      expect(result.severity).toBe('error');
      expect(result.retryable).toBe(false);
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network request failed');
      error.name = 'NetworkError';
      const context: ErrorContext = {
        userId: 'test-user',
        action: 'signin',
        component: 'SignInForm',
        timestamp: new Date(),
      };

      const result = classifyError(error, context);

      expect(result.code).toBe('network_error');
      expect(result.category).toBe('network');
      expect(result.severity).toBe('error');
      expect(result.retryable).toBe(true);
    });

    it('should classify server errors correctly', () => {
      const error = { status: 500, message: 'Internal server error' };
      const context: ErrorContext = {
        userId: 'test-user',
        action: 'signin',
        component: 'SignInForm',
        timestamp: new Date(),
      };

      const result = classifyError(error, context);

      expect(result.code).toBe('server_error');
      expect(result.category).toBe('server');
      expect(result.severity).toBe('critical');
      expect(result.retryable).toBe(true);
    });

    it('should classify unknown errors correctly', () => {
      const error = new Error('Unknown error');
      const context: ErrorContext = {
        userId: 'test-user',
        action: 'signin',
        component: 'SignInForm',
        timestamp: new Date(),
      };

      const result = classifyError(error, context);

      expect(result.code).toBe('unknown_error');
      expect(result.category).toBe('unknown');
      expect(result.severity).toBe('error');
      expect(result.retryable).toBe(true);
    });
  });

  describe('extractSupabaseErrorCode', () => {
    it('should extract error codes from Supabase messages', () => {
      expect(extractSupabaseErrorCode('Invalid login credentials')).toBe('invalid_credentials');
      expect(extractSupabaseErrorCode('Email not confirmed')).toBe('email_not_confirmed');
      expect(extractSupabaseErrorCode('Too many requests')).toBe('too_many_requests');
      expect(extractSupabaseErrorCode('Weak password')).toBe('weak_password');
      expect(extractSupabaseErrorCode('User not found')).toBe('user_not_found');
      expect(extractSupabaseErrorCode('Invalid token')).toBe('invalid_token');
    });

    it('should return null for unknown error messages', () => {
      expect(extractSupabaseErrorCode('Some random error')).toBeNull();
      expect(extractSupabaseErrorCode('')).toBeNull();
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors correctly', () => {
      expect(isNetworkError({ name: 'NetworkError' })).toBe(true);
      expect(isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(isNetworkError({ message: 'Network request failed' })).toBe(true);
      expect(isNetworkError({ message: 'fetch failed' })).toBe(true);
      expect(isNetworkError({ message: 'connection timeout' })).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError({ message: 'Authentication failed' })).toBe(false);
      expect(isNetworkError({})).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should identify server errors correctly', () => {
      expect(isServerError({ status: 500 })).toBe(true);
      expect(isServerError({ status: 502 })).toBe(true);
      expect(isServerError({ code: '500' })).toBe(true);
      expect(isServerError({ message: 'Internal server error' })).toBe(true);
    });

    it('should return false for non-server errors', () => {
      expect(isServerError({ message: 'Client error' })).toBe(false);
      expect(isServerError({})).toBe(false);
      expect(isServerError(null)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors correctly', () => {
      const retryableError: AuthError = {
        code: 'network_error',
        message: 'Network error',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
      };

      const nonRetryableError: AuthError = {
        code: 'invalid_credentials',
        message: 'Invalid credentials',
        category: 'authentication',
        severity: 'error',
        timestamp: new Date(),
        retryable: false,
      };

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate retry delay correctly', () => {
      const error: AuthError = {
        code: 'network_error',
        message: 'Network error',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
        retryAfter: 5000,
      };

      expect(getRetryDelay(error, 1)).toBe(5000);
      expect(getRetryDelay(error, 2)).toBe(10000);
      expect(getRetryDelay(error, 3)).toBe(20000);
    });

    it('should use default delay when retryAfter is not set', () => {
      const error: AuthError = {
        code: 'unknown_error',
        message: 'Unknown error',
        category: 'unknown',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
      };

      expect(getRetryDelay(error, 1)).toBe(1000);
    });
  });

  describe('shouldRetry', () => {
    it('should determine retry eligibility correctly', () => {
      const retryableError: AuthError = {
        code: 'network_error',
        message: 'Network error',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
      };

      const nonRetryableError: AuthError = {
        code: 'invalid_credentials',
        message: 'Invalid credentials',
        category: 'authentication',
        severity: 'error',
        timestamp: new Date(),
        retryable: false,
      };

      expect(shouldRetry(retryableError, 1, 3)).toBe(true);
      expect(shouldRetry(retryableError, 3, 3)).toBe(false);
      expect(shouldRetry(nonRetryableError, 1, 3)).toBe(false);
    });
  });

  describe('getErrorRecoveryOptions', () => {
    it('should provide correct recovery options for different error types', () => {
      const networkError: AuthError = {
        code: 'network_error',
        message: 'Network error',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
      };

      const sessionError: AuthError = {
        code: 'invalid_token',
        message: 'Session expired',
        category: 'session',
        severity: 'warning',
        timestamp: new Date(),
        retryable: false,
      };

      const networkOptions = getErrorRecoveryOptions(networkError);
      const sessionOptions = getErrorRecoveryOptions(sessionError);

      expect(networkOptions.retry).toBe(true);
      expect(networkOptions.showRetryButton).toBe(true);
      expect(networkOptions.showFallbackButton).toBe(true);

      expect(sessionOptions.retry).toBe(false);
      expect(sessionOptions.showRetryButton).toBe(false);
      expect(sessionOptions.showFallbackButton).toBe(true);
    });
  });

  describe('createErrorContext', () => {
    it('should create error context with provided values', () => {
      const context = createErrorContext('test-user', 'signin', 'SignInForm');

      expect(context.userId).toBe('test-user');
      expect(context.action).toBe('signin');
      expect(context.component).toBe('SignInForm');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should create error context with default values', () => {
      const context = createErrorContext();

      expect(context.userId).toBeUndefined();
      expect(context.action).toBeUndefined();
      expect(context.component).toBeUndefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });
});
