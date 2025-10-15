// __tests__/hooks/useTokenMonitoring.test.ts
// 토큰 모니터링 훅 테스트
// 사용량 추적, 경고 관리, 제한 확인 기능 테스트
// 관련 파일: lib/hooks/useTokenMonitoring.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTokenMonitoring } from '@/lib/hooks/useTokenMonitoring';

// fetch 모킹
global.fetch = jest.fn();

// useTokenUsageAlert 모킹
jest.mock('@/components/ui/token-usage-alert', () => ({
  useTokenUsageAlert: () => ({
    alerts: [],
    addWarningAlert: jest.fn(),
    addCriticalAlert: jest.fn(),
    clearAlerts: jest.fn(),
  }),
}));

describe('useTokenMonitoring', () => {
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

  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.usageData).toBe(null);
    expect(result.current.alerts).toEqual([]);
  });

  it('사용량 데이터를 올바르게 로드한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.usageData).toEqual(mockUsageData);
    });
  });

  it('API 에러를 올바르게 처리한다', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API 오류'));
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('API 오류');
      expect(result.current.usageData).toBe(null);
    });
  });

  it('사용량 기록이 올바르게 작동한다', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      await result.current.recordUsage(1000, 500, 'generate_summary');
    });
    
    expect(fetch).toHaveBeenCalledTimes(2); // 초기 로드 + 기록
    expect(fetch).toHaveBeenLastCalledWith('/api/token-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 1000,
        output: 500,
        operation: 'generate_summary',
      }),
    });
  });

  it('제한 설정 업데이트가 올바르게 작동한다', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const newLimits = {
      daily: 150000,
      hourly: 15000,
    };
    
    await act(async () => {
      await result.current.updateLimits(newLimits);
    });
    
    expect(fetch).toHaveBeenCalledTimes(2); // 초기 로드 + 업데이트
    expect(fetch).toHaveBeenLastCalledWith('/api/token-usage', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newLimits),
    });
  });

  it('사용률 계산이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const percentage = result.current.getUsagePercentage(50000, 100000);
    expect(percentage).toBe(50);
  });

  it('경고 레벨 계산이 올바르게 작동한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const warningLevel = result.current.getWarningLevel();
    expect(warningLevel).toBe('none'); // 50% 사용량
  });

  it('경고 상태에서 올바른 경고 레벨을 반환한다', async () => {
    const warningData = {
      ...mockUsageData,
      daily: 85000, // 80% 초과
    };
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => warningData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const warningLevel = result.current.getWarningLevel();
    expect(warningLevel).toBe('warning');
  });

  it('위험 상태에서 올바른 경고 레벨을 반환한다', async () => {
    const criticalData = {
      ...mockUsageData,
      daily: 100000, // 100% 도달
    };
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => criticalData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const warningLevel = result.current.getWarningLevel();
    expect(warningLevel).toBe('critical');
  });

  it('AI 사용 가능 여부를 올바르게 확인한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const canUseAI = result.current.canUseAI();
    expect(canUseAI).toBe(true); // 50% 사용량으로 사용 가능
  });

  it('제한 초과 시 AI 사용 불가능을 반환한다', async () => {
    const limitExceededData = {
      ...mockUsageData,
      daily: 100000, // 100% 도달
    };
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => limitExceededData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const canUseAI = result.current.canUseAI();
    expect(canUseAI).toBe(false);
  });

  it('남은 사용량을 올바르게 계산한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const remaining = result.current.getRemainingUsage();
    expect(remaining.daily).toBe(50000); // 100000 - 50000
    expect(remaining.hourly).toBe(5000); // 10000 - 5000
  });

  it('자동 새로고침이 올바르게 작동한다', async () => {
    jest.useFakeTimers();
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result } = renderHook(() => useTokenMonitoring('test-user'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // 30초 경과
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    
    jest.useRealTimers();
  });

  it('사용자 ID 변경 시 데이터를 다시 로드한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsageData,
    });
    
    const { result, rerender } = renderHook(
      ({ userId }) => useTokenMonitoring(userId),
      { initialProps: { userId: 'user-1' } }
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // 사용자 ID 변경
    rerender({ userId: 'user-2' });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
