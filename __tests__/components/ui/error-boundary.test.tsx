// __tests__/components/ui/error-boundary.test.tsx
// 에러 바운더리 컴포넌트 테스트 - React 에러 바운더리 테스트
// AI 메모장 프로젝트의 에러 바운더리 테스트

import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthError } from '@/lib/types/errors';
import React from 'react';

// 에러를 발생시키는 테스트 컴포넌트
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// 에러 바운더리 내부에서 사용할 컴포넌트
function TestComponent({ shouldThrow }: { shouldThrow: boolean }) {
  return (
    <ErrorBoundary>
      <ThrowError shouldThrow={shouldThrow} />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // 콘솔 에러 억제
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(<TestComponent shouldThrow={false} />);
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    render(<TestComponent shouldThrow={true} />);
    
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  it('should show retry and reload buttons', () => {
    render(<TestComponent shouldThrow={true} />);
    
    expect(screen.getByText('다시 시도')).toBeInTheDocument();
    expect(screen.getByText('페이지 새로고침')).toBeInTheDocument();
  });

  it('should handle retry button click', () => {
    const { rerender } = render(<TestComponent shouldThrow={true} />);
    
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    
    // 에러가 해결되면 원래 컴포넌트가 렌더링되어야 함
    rerender(<TestComponent shouldThrow={false} />);
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle reload button click', () => {
    // window.location.reload 모킹
    const reloadSpy = jest.fn();
    const originalLocation = window.location;
    
    delete (window as any).location;
    window.location = { ...originalLocation, reload: reloadSpy };

    render(<TestComponent shouldThrow={true} />);
    
    const reloadButton = screen.getByText('페이지 새로고침');
    fireEvent.click(reloadButton);
    
    expect(reloadSpy).toHaveBeenCalled();
    
    // 원래 location 복원
    window.location = originalLocation;
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onErrorSpy = jest.fn();
    
    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onErrorSpy).toHaveBeenCalled();
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'unknown_error',
        message: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        category: 'unknown',
        severity: 'error',
      }),
      expect.any(Object)
    );
  });

  it('should show developer info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<TestComponent shouldThrow={true} />);
    
    expect(screen.getByText('개발자 정보')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not show developer info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(<TestComponent shouldThrow={true} />);
    
    expect(screen.queryByText('개발자 정보')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});
