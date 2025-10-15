// __tests__/components/ui/error-display.test.tsx
// 에러 디스플레이 컴포넌트 테스트
// 에러 표시 및 복구 UI 검증

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, InlineErrorDisplay } from '@/components/ui/error-display';
import { AIError } from '@/lib/types/errors';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Server: () => <div data-testid="server-icon" />,
  Database: () => <div data-testid="database-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

describe('ErrorDisplay', () => {
  const mockOnRetry = jest.fn();
  const mockOnFallback = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
    mockOnFallback.mockClear();
  });

  const createTestError = (overrides: Partial<AIError> = {}): AIError => ({
    code: 'test_error',
    message: 'Test error message',
    category: 'api',
    severity: 'error',
    timestamp: new Date(),
    retryable: true,
    retryAfter: 5000,
    ...overrides,
  });

  describe('Basic Rendering', () => {
    it('should render error message', () => {
      const error = createTestError();
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('AI 처리 오류')).toBeInTheDocument();
    });

    it('should render error code and category', () => {
      const error = createTestError();
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('test_error')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
    });

    it('should render severity badge', () => {
      const error = createTestError({ severity: 'critical' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('심각')).toBeInTheDocument();
    });

    it('should render appropriate icons for different severities', () => {
      const { rerender } = render(<ErrorDisplay error={createTestError({ severity: 'warning' })} />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ severity: 'error' })} />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ severity: 'critical' })} />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render appropriate icons for different categories', () => {
      const { rerender } = render(<ErrorDisplay error={createTestError({ category: 'network' })} />);
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ category: 'api' })} />);
      expect(screen.getByTestId('server-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ category: 'token' })} />);
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ category: 'data' })} />);
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ category: 'system' })} />);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();

      rerender(<ErrorDisplay error={createTestError({ category: 'ai' })} />);
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when retryable and onRetry provided', () => {
      const error = createTestError({ retryable: true });
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('다시 시도');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should not show retry button when not retryable', () => {
      const error = createTestError({ retryable: false });
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
    });

    it('should not show retry button when onRetry not provided', () => {
      const error = createTestError({ retryable: true });
      render(<ErrorDisplay error={error} />);

      expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', () => {
      const error = createTestError({ retryable: true });
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('다시 시도');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show retrying state when isRetrying is true', () => {
      const error = createTestError({ retryable: true });
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} isRetrying={true} />);

      expect(screen.getByText('재시도 중...')).toBeInTheDocument();
      expect(screen.getByText('재시도 중...')).toBeDisabled();
    });
  });

  describe('Fallback Functionality', () => {
    it('should show fallback button when onFallback provided', () => {
      const error = createTestError();
      render(<ErrorDisplay error={error} onFallback={mockOnFallback} />);

      const fallbackButton = screen.getByText('수동 입력');
      expect(fallbackButton).toBeInTheDocument();
    });

    it('should not show fallback button when onFallback not provided', () => {
      const error = createTestError();
      render(<ErrorDisplay error={error} />);

      expect(screen.queryByText('수동 입력')).not.toBeInTheDocument();
    });

    it('should call onFallback when fallback button clicked', () => {
      const error = createTestError();
      render(<ErrorDisplay error={error} onFallback={mockOnFallback} />);

      const fallbackButton = screen.getByText('수동 입력');
      fireEvent.click(fallbackButton);

      expect(mockOnFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Guidance', () => {
    it('should show guidance for API key errors', () => {
      const error = createTestError({ code: 'api_key_invalid' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('해결 방법')).toBeInTheDocument();
      expect(screen.getByText('API 키가 유효하지 않습니다')).toBeInTheDocument();
      expect(screen.getByText('관리자에게 문의하여 API 키를 확인해주세요')).toBeInTheDocument();
    });

    it('should show guidance for token limit errors', () => {
      const error = createTestError({ code: 'token_limit_exceeded' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('텍스트가 너무 깁니다')).toBeInTheDocument();
      expect(screen.getByText('내용을 줄여서 다시 시도해주세요')).toBeInTheDocument();
      expect(screen.getByText('또는 수동으로 요약/태그를 작성해주세요')).toBeInTheDocument();
    });

    it('should show guidance for network errors', () => {
      const error = createTestError({ code: 'api_timeout' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('네트워크 연결을 확인해주세요')).toBeInTheDocument();
      expect(screen.getByText('인터넷 연결이 안정적인지 확인해주세요')).toBeInTheDocument();
    });

    it('should show guidance for server errors', () => {
      const error = createTestError({ code: 'api_server_error' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('AI 서버에 일시적인 문제가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('잠시 후 다시 시도해주세요')).toBeInTheDocument();
    });

    it('should show guidance for content filtered errors', () => {
      const error = createTestError({ code: 'content_filtered' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('내용이 정책에 위배됩니다')).toBeInTheDocument();
      expect(screen.getByText('다른 내용으로 다시 시도해주세요')).toBeInTheDocument();
    });
  });

  describe('Retry After Display', () => {
    it('should show retry after time when retryable and retryAfter provided', () => {
      const error = createTestError({ retryable: true, retryAfter: 10000 });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('10초 후 자동 재시도 가능')).toBeInTheDocument();
    });

    it('should not show retry after time when not retryable', () => {
      const error = createTestError({ retryable: false, retryAfter: 10000 });
      render(<ErrorDisplay error={error} />);

      expect(screen.queryByText('자동 재시도 가능')).not.toBeInTheDocument();
    });

    it('should not show retry after time when retryAfter not provided', () => {
      const error = createTestError({ retryable: true });
      render(<ErrorDisplay error={error} />);

      expect(screen.queryByText('자동 재시도 가능')).not.toBeInTheDocument();
    });
  });

  describe('Additional Information', () => {
    it('should show API endpoint when provided', () => {
      const error = createTestError({ apiEndpoint: 'generate_summary' });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('generate_summary')).toBeInTheDocument();
    });

    it('should show retry count when provided', () => {
      const error = createTestError({ retryCount: 3 });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('3회')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const error = createTestError();
      const { container } = render(
        <ErrorDisplay error={error} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('InlineErrorDisplay', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  const createTestError = (overrides: Partial<AIError> = {}): AIError => ({
    code: 'test_error',
    message: 'Test error message',
    category: 'api',
    severity: 'error',
    timestamp: new Date(),
    retryable: true,
    retryAfter: 5000,
    ...overrides,
  });

  describe('Basic Rendering', () => {
    it('should render error message', () => {
      const error = createTestError();
      render(<InlineErrorDisplay error={error} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render appropriate icon', () => {
      const error = createTestError({ severity: 'error' });
      render(<InlineErrorDisplay error={error} />);

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when retryable and onRetry provided', () => {
      const error = createTestError({ retryable: true });
      render(<InlineErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('재시도');
      expect(retryButton).toBeInTheDocument();
    });

    it('should not show retry button when not retryable', () => {
      const error = createTestError({ retryable: false });
      render(<InlineErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.queryByText('재시도')).not.toBeInTheDocument();
    });

    it('should not show retry button when onRetry not provided', () => {
      const error = createTestError({ retryable: true });
      render(<InlineErrorDisplay error={error} />);

      expect(screen.queryByText('재시도')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', () => {
      const error = createTestError({ retryable: true });
      render(<InlineErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('재시도');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show retrying state when isRetrying is true', () => {
      const error = createTestError({ retryable: true });
      render(<InlineErrorDisplay error={error} onRetry={mockOnRetry} isRetrying={true} />);

      expect(screen.getByText('재시도 중')).toBeInTheDocument();
      expect(screen.getByText('재시도 중')).toBeDisabled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const error = createTestError();
      const { container } = render(
        <InlineErrorDisplay error={error} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
