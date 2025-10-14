// components/ui/error-message.tsx
// 에러 메시지 컴포넌트 - 에러 표시 및 복구 옵션 제공
// AI 메모장 프로젝트의 에러 메시지 UI

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthError, ErrorRecoveryOptions, getErrorRecoveryOptions } from '@/lib/types/errors';
import { getRetryDelay, shouldRetry } from '@/lib/utils/errorHandler';

interface ErrorMessageProps {
  error: AuthError;
  onRetry?: () => void;
  onFallback?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onFallback, 
  onDismiss,
  className = '' 
}: ErrorMessageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const recoveryOptions = getErrorRecoveryOptions(error);
  const canRetry = shouldRetry(error, retryCount, recoveryOptions.maxRetries);

  const handleRetry = async () => {
    if (!canRetry || !onRetry) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(error.severity)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getSeverityIcon(error.severity)}
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            {error.message}
          </h3>
          
          {error.code && (
            <p className="text-xs mt-1 opacity-75">
              오류 코드: {error.code}
            </p>
          )}
          
          {retryCount > 0 && (
            <p className="text-xs mt-1 opacity-75">
              재시도 횟수: {retryCount}/{recoveryOptions.maxRetries}
            </p>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-3 text-current opacity-50 hover:opacity-75"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {(recoveryOptions.showRetryButton || recoveryOptions.showFallbackButton) && (
        <div className="mt-3 flex space-x-2">
          {recoveryOptions.showRetryButton && canRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-xs"
            >
              {isRetrying ? '재시도 중...' : '다시 시도'}
            </Button>
          )}
          
          {recoveryOptions.showFallbackButton && onFallback && (
            <Button
              size="sm"
              variant="outline"
              onClick={onFallback}
              className="text-xs"
            >
              {recoveryOptions.fallbackAction || '대안 시도'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
