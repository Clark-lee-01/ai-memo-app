// lib/hooks/useErrorHandler.ts
// 에러 핸들링 훅 - 에러 처리 및 복구 로직
// AI 메모장 프로젝트의 에러 핸들링 훅

'use client';

import { useState, useCallback } from 'react';
import { AuthError, ErrorContext, ErrorRecoveryOptions } from '@/lib/types/errors';
import { 
  classifyError, 
  createErrorContext, 
  logError, 
  getErrorRecoveryOptions,
  shouldRetry,
  getRetryDelay
} from '@/lib/utils/errorHandler';

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: AuthError) => void;
  onRetry?: (error: AuthError, attemptCount: number) => Promise<void>;
  onFallback?: (error: AuthError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errors, setErrors] = useState<AuthError[]>([]);
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});
  
  const {
    maxRetries = 3,
    onError,
    onRetry,
    onFallback,
  } = options;

  const handleError = useCallback((
    error: any,
    context: Partial<ErrorContext> = {}
  ): AuthError => {
    const errorContext = createErrorContext(
      context.userId,
      context.action,
      context.component
    );
    
    const authError = classifyError(error, errorContext);
    
    // 에러 로깅
    logError(authError, errorContext);
    
    // 에러 상태 업데이트
    setErrors(prev => [...prev, authError]);
    
    // 부모 컴포넌트에 에러 전달
    if (onError) {
      onError(authError);
    }
    
    return authError;
  }, [onError]);

  const retryError = useCallback(async (error: AuthError): Promise<boolean> => {
    const currentRetryCount = retryCounts[error.code] || 0;
    
    if (!shouldRetry(error, currentRetryCount, maxRetries)) {
      return false;
    }
    
    const newRetryCount = currentRetryCount + 1;
    setRetryCounts(prev => ({
      ...prev,
      [error.code]: newRetryCount,
    }));
    
    try {
      if (onRetry) {
        await onRetry(error, newRetryCount);
      }
      
      // 재시도 성공 시 에러 제거
      setErrors(prev => prev.filter(e => e.code !== error.code));
      return true;
    } catch (retryError) {
      // 재시도 실패 시 새로운 에러로 처리
      handleError(retryError, {
        action: `retry_${error.code}`,
        component: 'useErrorHandler',
      });
      return false;
    }
  }, [retryCounts, maxRetries, onRetry, handleError]);

  const handleFallback = useCallback((error: AuthError) => {
    if (onFallback) {
      onFallback(error);
    }
    
    // 폴백 실행 후 에러 제거
    setErrors(prev => prev.filter(e => e.code !== error.code));
  }, [onFallback]);

  const dismissError = useCallback((errorCode: string) => {
    setErrors(prev => prev.filter(e => e.code !== errorCode));
    setRetryCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[errorCode];
      return newCounts;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setRetryCounts({});
  }, []);

  const getErrorRecoveryOptionsForError = useCallback((error: AuthError): ErrorRecoveryOptions => {
    const baseOptions = getErrorRecoveryOptions(error);
    const currentRetryCount = retryCounts[error.code] || 0;
    
    return {
      ...baseOptions,
      retryCount: currentRetryCount,
      retry: shouldRetry(error, currentRetryCount, maxRetries),
    };
  }, [retryCounts, maxRetries]);

  const getRetryDelayForError = useCallback((error: AuthError): number => {
    const currentRetryCount = retryCounts[error.code] || 0;
    return getRetryDelay(error, currentRetryCount);
  }, [retryCounts]);

  return {
    errors,
    handleError,
    retryError,
    handleFallback,
    dismissError,
    clearAllErrors,
    getErrorRecoveryOptions: getErrorRecoveryOptionsForError,
    getRetryDelay: getRetryDelayForError,
    hasErrors: errors.length > 0,
  };
}
