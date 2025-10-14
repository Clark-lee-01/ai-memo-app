// __tests__/hooks/useErrorHandler.test.ts
// useErrorHandler 훅 테스트 - 에러 핸들링 훅 테스트
// AI 메모장 프로젝트의 에러 핸들링 훅 테스트

import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { AuthError, ErrorContext } from '@/lib/types/errors';

describe('useErrorHandler', () => {
  it('should initialize with empty errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.errors).toEqual([]);
    expect(result.current.hasErrors).toBe(false);
  });

  it('should handle errors correctly', () => {
    const onErrorSpy = jest.fn();
    const { result } = renderHook(() => useErrorHandler({ onError: onErrorSpy }));
    
    const testError = new Error('Test error');
    const context: Partial<ErrorContext> = {
      userId: 'test-user',
      action: 'signin',
      component: 'SignInForm',
    };
    
    act(() => {
      result.current.handleError(testError, context);
    });
    
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.hasErrors).toBe(true);
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'unknown_error',
        message: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        category: 'unknown',
        severity: 'error',
      })
    );
  });

  it('should retry errors correctly', async () => {
    const onRetrySpy = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useErrorHandler({ onRetry: onRetrySpy }));
    
    const testError = new Error('Network error');
    testError.name = 'NetworkError';
    
    act(() => {
      result.current.handleError(testError);
    });
    
    const error = result.current.errors[0];
    
    await act(async () => {
      const success = await result.current.retryError(error);
      expect(success).toBe(true);
    });
    
    expect(onRetrySpy).toHaveBeenCalledWith(error, 1);
    expect(result.current.errors).toHaveLength(0);
  });

  it('should handle retry failure', async () => {
    const onRetrySpy = jest.fn().mockRejectedValue(new Error('Retry failed'));
    const { result } = renderHook(() => useErrorHandler({ onRetry: onRetrySpy }));
    
    const testError = new Error('Network error');
    testError.name = 'NetworkError';
    
    act(() => {
      result.current.handleError(testError);
    });
    
    const error = result.current.errors[0];
    
    await act(async () => {
      const success = await result.current.retryError(error);
      expect(success).toBe(false);
    });
    
    expect(result.current.errors).toHaveLength(2); // 원래 에러 + 재시도 실패 에러
  });

  it('should handle fallback correctly', () => {
    const onFallbackSpy = jest.fn();
    const { result } = renderHook(() => useErrorHandler({ onFallback: onFallbackSpy }));
    
    const testError = new Error('Test error');
    
    act(() => {
      result.current.handleError(testError);
    });
    
    const error = result.current.errors[0];
    
    act(() => {
      result.current.handleFallback(error);
    });
    
    expect(onFallbackSpy).toHaveBeenCalledWith(error);
    expect(result.current.errors).toHaveLength(0);
  });

  it('should dismiss errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const testError = new Error('Test error');
    
    act(() => {
      result.current.handleError(testError);
    });
    
    expect(result.current.errors).toHaveLength(1);
    
    act(() => {
      result.current.dismissError('unknown_error');
    });
    
    expect(result.current.errors).toHaveLength(0);
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError(new Error('Error 1'));
      result.current.handleError(new Error('Error 2'));
    });
    
    expect(result.current.errors).toHaveLength(2);
    
    act(() => {
      result.current.clearAllErrors();
    });
    
    expect(result.current.errors).toHaveLength(0);
  });

  it('should provide correct recovery options', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const testError = new Error('Network error');
    testError.name = 'NetworkError';
    
    act(() => {
      result.current.handleError(testError);
    });
    
    const error = result.current.errors[0];
    const recoveryOptions = result.current.getErrorRecoveryOptions(error);
    
    expect(recoveryOptions.retry).toBe(true);
    expect(recoveryOptions.showRetryButton).toBe(true);
    expect(recoveryOptions.showFallbackButton).toBe(true);
  });

  it('should calculate retry delay correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const testError = new Error('Network error');
    testError.name = 'NetworkError';
    
    act(() => {
      result.current.handleError(testError);
    });
    
    const error = result.current.errors[0];
    const delay = result.current.getRetryDelay(error);
    
    expect(delay).toBe(5000); // 네트워크 에러의 기본 retryAfter
  });
});
