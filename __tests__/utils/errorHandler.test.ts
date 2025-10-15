// __tests__/utils/errorHandler.test.ts
// 에러 핸들러 테스트
// AI 에러 분류 및 처리 로직 검증

import {
  classifyError,
  classifyAIError,
  extractAIErrorCode,
  isNetworkError,
  isServerError,
  isRetryableError,
  shouldRetry,
  getRetryDelay,
  getErrorRecoveryOptions,
} from '@/lib/utils/errorHandler';
import { createErrorContext } from '@/lib/utils/errorHandler';
import { AI_ERRORS } from '@/lib/types/errors';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handler', () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('classifyAIError', () => {
    it('should classify API key errors correctly', () => {
      const error = new Error('API key is invalid');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeTruthy();
      expect(result?.code).toBe('api_key_invalid');
      expect(result?.category).toBe('api');
      expect(result?.severity).toBe('critical');
      expect(result?.retryable).toBe(false);
    });

    it('should classify token limit errors correctly', () => {
      const error = new Error('Token limit exceeded');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeTruthy();
      expect(result?.code).toBe('token_limit_exceeded');
      expect(result?.category).toBe('token');
      expect(result?.severity).toBe('error');
      expect(result?.retryable).toBe(false);
    });

    it('should classify rate limit errors correctly', () => {
      const error = new Error('Rate limit exceeded');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeTruthy();
      expect(result?.code).toBe('rate_limit_exceeded');
      expect(result?.category).toBe('api');
      expect(result?.severity).toBe('warning');
      expect(result?.retryable).toBe(true);
      expect(result?.retryAfter).toBe(60000);
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network connection failed');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeTruthy();
      expect(result?.code).toBe('network_connection_failed');
      expect(result?.category).toBe('network');
      expect(result?.severity).toBe('error');
      expect(result?.retryable).toBe(true);
      expect(result?.retryAfter).toBe(5000);
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Request timeout');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeTruthy();
      expect(result?.code).toBe('api_timeout');
      expect(result?.category).toBe('network');
      expect(result?.severity).toBe('error');
      expect(result?.retryable).toBe(true);
      expect(result?.retryAfter).toBe(5000);
    });

    it('should return null for unrecognized errors', () => {
      const error = new Error('Some random error');
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyAIError(error, context);
      
      expect(result).toBeNull();
    });
  });

  describe('extractAIErrorCode', () => {
    it('should extract API key error codes', () => {
      expect(extractAIErrorCode({ message: 'API key is invalid' })).toBe('api_key_invalid');
      expect(extractAIErrorCode({ message: 'API key has expired' })).toBe('api_key_expired');
    });

    it('should extract token error codes', () => {
      expect(extractAIErrorCode({ message: 'Token limit exceeded' })).toBe('token_limit_exceeded');
    });

    it('should extract rate limit error codes', () => {
      expect(extractAIErrorCode({ message: 'Rate limit exceeded' })).toBe('rate_limit_exceeded');
    });

    it('should extract network error codes', () => {
      expect(extractAIErrorCode({ message: 'Network connection failed' })).toBe('network_connection_failed');
      expect(extractAIErrorCode({ message: 'DNS resolution failed' })).toBe('dns_resolution_failed');
      expect(extractAIErrorCode({ message: 'SSL certificate error' })).toBe('ssl_certificate_error');
    });

    it('should extract server error codes', () => {
      expect(extractAIErrorCode({ message: 'Server error occurred' })).toBe('api_server_error');
    });

    it('should return null for unrecognized error messages', () => {
      expect(extractAIErrorCode({ message: 'Some random error' })).toBeNull();
      expect(extractAIErrorCode({})).toBeNull();
      expect(extractAIErrorCode(null)).toBeNull();
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors correctly', () => {
      expect(isNetworkError({ name: 'NetworkError' })).toBe(true);
      expect(isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(isNetworkError({ message: 'Network connection failed' })).toBe(true);
      expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true);
      expect(isNetworkError({ message: 'Connection timeout' })).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError({ name: 'ValidationError' })).toBe(false);
      expect(isNetworkError({ code: 'VALIDATION_ERROR' })).toBe(false);
      expect(isNetworkError({ message: 'Invalid input' })).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should identify server errors correctly', () => {
      expect(isServerError({ status: 500 })).toBe(true);
      expect(isServerError({ status: 502 })).toBe(true);
      expect(isServerError({ status: 503 })).toBe(true);
      expect(isServerError({ code: '500' })).toBe(true);
      expect(isServerError({ code: '5xx' })).toBe(true);
      expect(isServerError({ message: 'Server error occurred' })).toBe(true);
      expect(isServerError({ message: 'Internal server error' })).toBe(true);
    });

    it('should return false for non-server errors', () => {
      expect(isServerError({ status: 400 })).toBe(false);
      expect(isServerError({ status: 404 })).toBe(false);
      expect(isServerError({ code: '400' })).toBe(false);
      expect(isServerError({ message: 'Client error' })).toBe(false);
      expect(isServerError(null)).toBe(false);
      expect(isServerError(undefined)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors correctly', () => {
      const retryableError = {
        retryable: true,
        severity: 'warning' as const,
      };
      const nonRetryableError = {
        retryable: false,
        severity: 'error' as const,
      };
      const criticalError = {
        retryable: true,
        severity: 'critical' as const,
      };

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
      expect(isRetryableError(criticalError)).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('should determine retry eligibility correctly', () => {
      const retryableError = {
        retryable: true,
        severity: 'warning' as const,
      };
      const nonRetryableError = {
        retryable: false,
        severity: 'error' as const,
      };
      const criticalError = {
        retryable: true,
        severity: 'critical' as const,
      };

      expect(shouldRetry(retryableError, 1, 3)).toBe(true);
      expect(shouldRetry(retryableError, 3, 3)).toBe(false);
      expect(shouldRetry(nonRetryableError, 1, 3)).toBe(false);
      expect(shouldRetry(criticalError, 1, 3)).toBe(false);
      expect(shouldRetry(criticalError, 2, 3)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate retry delay correctly', () => {
      const error = {
        retryAfter: 5000,
        retryable: true,
        severity: 'warning' as const,
      };

      expect(getRetryDelay(error, 1)).toBe(5000);
      expect(getRetryDelay(error, 2)).toBe(10000);
      expect(getRetryDelay(error, 3)).toBe(20000);
    });

    it('should cap retry delay at maximum', () => {
      const error = {
        retryAfter: 10000,
        retryable: true,
        severity: 'warning' as const,
      };

      expect(getRetryDelay(error, 5)).toBe(30000); // Capped at 30 seconds
    });

    it('should use default delay when retryAfter is not set', () => {
      const error = {
        retryable: true,
        severity: 'warning' as const,
      };

      expect(getRetryDelay(error, 1)).toBe(1000);
    });
  });

  describe('getErrorRecoveryOptions', () => {
    it('should provide appropriate recovery options for network errors', () => {
      const networkError = {
        code: 'network_error',
        message: 'Network connection failed',
        category: 'network' as const,
        severity: 'error' as const,
        retryable: true,
        retryAfter: 5000,
        timestamp: new Date(),
        userId: 'user123',
      };

      const options = getErrorRecoveryOptions(networkError);

      expect(options.retry).toBe(true);
      expect(options.showRetryButton).toBe(true);
      expect(options.showFallbackButton).toBe(true);
      expect(options.fallbackAction).toBe('네트워크 설정 확인');
    });

    it('should provide appropriate recovery options for session errors', () => {
      const sessionError = {
        code: 'invalid_token',
        message: 'Session expired',
        category: 'session' as const,
        severity: 'warning' as const,
        retryable: false,
        timestamp: new Date(),
        userId: 'user123',
      };

      const options = getErrorRecoveryOptions(sessionError);

      expect(options.retry).toBe(false);
      expect(options.showRetryButton).toBe(false);
      expect(options.showFallbackButton).toBe(true);
      expect(options.fallbackAction).toBe('다시 로그인');
    });

    it('should provide appropriate recovery options for authentication errors', () => {
      const authError = {
        code: 'invalid_credentials',
        message: 'Invalid credentials',
        category: 'authentication' as const,
        severity: 'error' as const,
        retryable: false,
        timestamp: new Date(),
        userId: 'user123',
      };

      const options = getErrorRecoveryOptions(authError);

      expect(options.retry).toBe(false);
      expect(options.showRetryButton).toBe(false);
      expect(options.showFallbackButton).toBe(true);
      expect(options.fallbackAction).toBe('로그인 페이지로 이동');
    });

    it('should provide appropriate recovery options for server errors', () => {
      const serverError = {
        code: 'server_error',
        message: 'Server error',
        category: 'server' as const,
        severity: 'critical' as const,
        retryable: true,
        retryAfter: 10000,
        timestamp: new Date(),
        userId: 'user123',
      };

      const options = getErrorRecoveryOptions(serverError);

      expect(options.retry).toBe(true);
      expect(options.showRetryButton).toBe(true);
      expect(options.maxRetries).toBe(2);
      expect(options.showFallbackButton).toBe(true);
      expect(options.fallbackAction).toBe('잠시 후 다시 시도');
    });
  });

  describe('classifyError', () => {
    it('should prioritize AI error classification', () => {
      const geminiError = {
        name: 'GeminiAPIError',
        message: 'API key is invalid',
        code: 'api_key_invalid',
      };
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyError(geminiError, context);
      
      expect(result).toBeTruthy();
      expect(result.code).toBe('api_key_invalid');
      expect(result.category).toBe('api');
    });

    it('should fall back to network error classification', () => {
      const networkError = {
        name: 'NetworkError',
        message: 'Network connection failed',
      };
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyError(networkError, context);
      
      expect(result).toBeTruthy();
      expect(result.code).toBe('network_error');
      expect(result.category).toBe('network');
    });

    it('should fall back to server error classification', () => {
      const serverError = {
        status: 500,
        message: 'Internal server error',
      };
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyError(serverError, context);
      
      expect(result).toBeTruthy();
      expect(result.code).toBe('server_error');
      expect(result.category).toBe('server');
    });

    it('should fall back to unknown error classification', () => {
      const unknownError = {
        message: 'Some random error',
      };
      const context = createErrorContext('user123', 'generate_summary', 'gemini-api');
      
      const result = classifyError(unknownError, context);
      
      expect(result).toBeTruthy();
      expect(result.code).toBe('unknown_error');
      expect(result.category).toBe('unknown');
    });
  });
});