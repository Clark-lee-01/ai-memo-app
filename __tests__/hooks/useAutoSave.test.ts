// __tests__/hooks/useAutoSave.test.ts
// 자동 저장 훅 테스트 - useAutoSave 훅의 기능 검증
// AI 메모장 프로젝트의 자동 저장 테스트

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

// Mock timers
jest.useFakeTimers();

describe('useAutoSave', () => {
  const mockOnSave = jest.fn();
  const defaultOptions = {
    data: { title: 'Test Title', content: 'Test Content' },
    onSave: mockOnSave,
    debounceMs: 100, // 테스트를 위해 짧게 설정
    intervalMs: 200, // 테스트를 위해 짧게 설정
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('초기 상태가 올바르게 설정된다', () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));

    expect(result.current.saveStatus.status).toBe('idle');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('데이터가 변경되면 hasUnsavedChanges가 true가 된다', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('디바운싱된 저장이 작동한다', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 디바운스 시간 전에는 저장되지 않음
    expect(mockOnSave).not.toHaveBeenCalled();

    // 디바운스 시간 경과
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ title: 'Changed', content: 'Changed' });
    });
  });

  it('주기적 저장이 작동한다', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 첫 번째 디바운스 저장
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    // 주기적 저장 (200ms 후)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });
  });

  it('저장 중 상태가 올바르게 표시된다', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 디바운스 시간 경과
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // 저장 중 상태 확인
    expect(result.current.saveStatus.status).toBe('saving');

    // 저장 완료
    act(() => {
      resolveSave!();
    });

    await waitFor(() => {
      expect(result.current.saveStatus.status).toBe('saved');
      expect(result.current.saveStatus.lastSaved).toBeInstanceOf(Date);
    });
  });

  it('저장 실패 시 에러 상태가 표시된다', async () => {
    const error = new Error('Save failed');
    mockOnSave.mockRejectedValue(error);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 디바운스 시간 경과
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.saveStatus.status).toBe('error');
      expect(result.current.saveStatus.error).toBe('Save failed');
    });
  });

  it('수동 저장이 작동한다', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 수동 저장
    await act(async () => {
      await result.current.manualSave();
    });

    expect(mockOnSave).toHaveBeenCalledWith({ title: 'Changed', content: 'Changed' });
  });

  it('enabled가 false일 때 자동 저장이 비활성화된다', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data, enabled: false }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    // 디바운스 시간 경과
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // 저장되지 않음
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('resetSaveStatus가 작동한다', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ ...defaultOptions, data }),
      { initialProps: { data: { title: 'Original', content: 'Original' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Changed', content: 'Changed' } });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // 상태 초기화
    act(() => {
      result.current.resetSaveStatus();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.saveStatus.status).toBe('idle');
  });
});
