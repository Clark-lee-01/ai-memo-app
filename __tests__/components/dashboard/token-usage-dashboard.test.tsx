// __tests__/components/dashboard/token-usage-dashboard.test.tsx
// 토큰 사용량 대시보드 컴포넌트 테스트
// 사용량 표시, 경고, 새로고침 기능 테스트
// 관련 파일: components/dashboard/token-usage-dashboard.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenUsageDashboard from '@/components/dashboard/token-usage-dashboard';

// fetch 모킹
global.fetch = jest.fn();

// Progress 컴포넌트 모킹
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" className={className} style={{ width: `${value}%` }}>
      {value}%
    </div>
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

// Badge 컴포넌트 모킹
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

// 아이콘 모킹
jest.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

describe('TokenUsageDashboard', () => {
  const mockUsageData = {
    daily: 50000,
    hourly: 5000,
    limits: {
      daily: 100000,
      hourly: 10000,
      perRequest: 8000,
      warningThreshold: 0.8,
    },
    stats: {
      totalUsage: 350000,
      averageDaily: 50000,
      peakHourly: 8000,
      operations: {
        'generate_summary': 200000,
        'generate_tags': 150000,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // 무한 로딩
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    expect(screen.getByText('토큰 사용량 대시보드')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('에러 상태를 올바르게 표시한다', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API 오류'));
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('API 오류')).toBeInTheDocument();
    });
  });

  it('사용량 데이터를 올바르게 표시한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('50,000')).toBeInTheDocument(); // 일일 사용량
      expect(screen.getByText('5,000')).toBeInTheDocument(); // 시간당 사용량
      expect(screen.getByText('50,000')).toBeInTheDocument(); // 평균 일일 사용량
      expect(screen.getByText('8,000')).toBeInTheDocument(); // 피크 시간당 사용량
    });
  });

  it('경고 메시지를 올바르게 표시한다', async () => {
    const warningData = {
      ...mockUsageData,
      daily: 85000, // 80% 초과
    };
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => warningData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText(/일일 토큰 사용량이 80%에 도달했습니다/)).toBeInTheDocument();
    });
  });

  it('위험 상태를 올바르게 표시한다', async () => {
    const criticalData = {
      ...mockUsageData,
      daily: 100000, // 100% 도달
    };
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => criticalData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText(/일일 토큰 사용량이 초과되었습니다/)).toBeInTheDocument();
    });
  });

  it('새로고침 버튼이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('새로고침')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);
    
    expect(fetch).toHaveBeenCalledTimes(2); // 초기 로드 + 새로고침
  });

  it('작업별 사용량을 올바르게 표시한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('generate_summary')).toBeInTheDocument();
      expect(screen.getByText('200,000 토큰')).toBeInTheDocument();
      expect(screen.getByText('generate_tags')).toBeInTheDocument();
      expect(screen.getByText('150,000 토큰')).toBeInTheDocument();
    });
  });

  it('사용률을 올바르게 계산한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      const progressBars = screen.getAllByTestId('progress');
      expect(progressBars[0]).toHaveStyle({ width: '50%' }); // 일일 사용률 50%
      expect(progressBars[1]).toHaveStyle({ width: '50%' }); // 시간당 사용률 50%
    });
  });

  it('데이터 없음 상태를 올바르게 표시한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => null,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('사용량 데이터를 불러올 수 없습니다')).toBeInTheDocument();
    });
  });

  it('자동 새로고침이 올바르게 작동한다', async () => {
    jest.useFakeTimers();
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    render(<TokenUsageDashboard userId="test-user" />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    // 30초 경과
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    
    jest.useRealTimers();
  });
});
