// components/ui/error-boundary.tsx
// 에러 바운더리 컴포넌트 - React 에러 바운더리 구현
// AI 메모장 프로젝트의 에러 처리 UI

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AuthError, ErrorContext, classifyError, createErrorContext, logError } from '@/lib/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AuthError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AuthError | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error: classifyError(error, createErrorContext()),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const authError = classifyError(error, createErrorContext());
    
    this.setState({
      error: authError,
      errorInfo,
    });

    // 에러 로깅
    logError(authError, createErrorContext());

    // 부모 컴포넌트에 에러 전달
    if (this.props.onError) {
      this.props.onError(authError, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {error?.severity === 'critical' ? '치명적 오류' : '오류가 발생했습니다'}
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {error?.message || '예상치 못한 오류가 발생했습니다.'}
              </p>
              {error?.code && (
                <p className="text-xs text-gray-500 mt-1">
                  오류 코드: {error.code}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button onClick={this.handleRetry} variant="outline">
                다시 시도
              </Button>
              <Button onClick={this.handleReload}>
                페이지 새로고침
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  개발자 정보
                </summary>
                <pre className="mt-2 text-xs text-gray-400 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
