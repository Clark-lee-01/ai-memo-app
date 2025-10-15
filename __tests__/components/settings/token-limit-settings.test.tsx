// __tests__/components/settings/token-limit-settings.test.tsx
// 토큰 사용량 제한 설정 컴포넌트 테스트
// 설정 로드, 저장, 검증 기능 테스트
// 관련 파일: components/settings/token-limit-settings.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenLimitSettings from '@/components/settings/token-limit-settings';

// fetch 모킹
global.fetch = jest.fn();

// Card 컴포넌트 모킹
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-description" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}));

// Button 컴포넌트 모킹
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Input 컴포넌트 모킹
jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, min, max, step, id }: {
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
  }) => (
    <input
      data-testid="input"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
    />
  ),
}));

// Label 컴포넌트 모킹
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label data-testid="label" htmlFor={htmlFor}>{children}</label>
  ),
}));

// Alert 컴포넌트 모킹
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

// 아이콘 모킹
jest.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
}));

describe('TokenLimitSettings', () => {
  const mockLimits = {
    daily: 100000,
    hourly: 10000,
    perRequest: 8000,
    warningThreshold: 0.8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // 무한 로딩
    
    render(<TokenLimitSettings userId="test-user" />);
    
    expect(screen.getByText('토큰 사용량 제한 설정')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('에러 상태를 올바르게 표시한다', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API 오류'));
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('API 오류')).toBeInTheDocument();
    });
  });

  it('설정 데이터를 올바르게 로드한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument(); // 일일 제한
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument(); // 시간당 제한
      expect(screen.getByDisplayValue('8000')).toBeInTheDocument(); // 요청당 제한
      expect(screen.getByDisplayValue('0.8')).toBeInTheDocument(); // 경고 임계값
    });
  });

  it('입력값 변경이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const dailyInput = screen.getByDisplayValue('100000');
      fireEvent.change(dailyInput, { target: { value: '150000' } });
      expect(dailyInput).toHaveValue(150000);
    });
  });

  it('설정 저장이 올바르게 작동한다', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ limits: mockLimits }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('설정 저장')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByText('설정 저장');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // 로드 + 저장
    });
  });

  it('설정 초기화가 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const dailyInput = screen.getByDisplayValue('100000');
      fireEvent.change(dailyInput, { target: { value: '150000' } });
    });
    
    const resetButton = screen.getByText('초기화');
    fireEvent.click(resetButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument(); // 기본값으로 복원
    });
  });

  it('입력값 검증이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const dailyInput = screen.getByDisplayValue('100000');
      fireEvent.change(dailyInput, { target: { value: '0' } }); // 잘못된 값
    });
    
    await waitFor(() => {
      expect(screen.getByText('일일 토큰 제한은 0보다 커야 합니다')).toBeInTheDocument();
    });
  });

  it('관계 검증이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const hourlyInput = screen.getByDisplayValue('10000');
      fireEvent.change(hourlyInput, { target: { value: '150000' } }); // 일일 제한보다 큰 값
    });
    
    await waitFor(() => {
      expect(screen.getByText('시간당 제한은 일일 제한보다 작아야 합니다')).toBeInTheDocument();
    });
  });

  it('성공 메시지를 올바르게 표시한다', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ limits: mockLimits }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const saveButton = screen.getByText('설정 저장');
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('설정이 성공적으로 저장되었습니다')).toBeInTheDocument();
    });
  });

  it('저장 실패 시 에러를 올바르게 표시한다', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ limits: mockLimits }),
      })
      .mockRejectedValueOnce(new Error('저장 실패'));
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const saveButton = screen.getByText('설정 저장');
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('저장 실패')).toBeInTheDocument();
    });
  });

  it('폼 검증 실패 시 저장 버튼이 비활성화된다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ limits: mockLimits }),
    });
    
    render(<TokenLimitSettings userId="test-user" />);
    
    await waitFor(() => {
      const dailyInput = screen.getByDisplayValue('100000');
      fireEvent.change(dailyInput, { target: { value: '0' } }); // 잘못된 값
    });
    
    await waitFor(() => {
      const saveButton = screen.getByText('설정 저장');
      expect(saveButton).toBeDisabled();
    });
  });
});
