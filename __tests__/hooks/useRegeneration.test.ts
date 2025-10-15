// __tests__/hooks/useRegeneration.test.ts
// useRegeneration 훅 테스트 - AI 결과 재생성 기능 검증
// AI 메모장 프로젝트의 재생성 기능 관리 커스텀 훅 테스트
// 관련 파일: lib/hooks/useRegeneration.ts

import { renderHook, act } from '@testing-library/react';
import { useRegeneration } from '@/lib/hooks/useRegeneration';

// useAIStatus 훅 모킹
jest.mock('@/lib/hooks/useAIStatus', () => ({
  useAIStatus: jest.fn(),
}));

const mockUseAIStatus = require('@/lib/hooks/useAIStatus').useAIStatus;

describe('useRegeneration', () => {
  const mockRegenerationFunction = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const mockAIStatus = {
    reset: jest.fn(),
    startProcessing: jest.fn(),
    markSuccess: jest.fn(),
    markError: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    isProcessing: false,
    getErrorMessage: jest.fn(),
    canRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAIStatus.mockReturnValue(mockAIStatus);
  });

  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    expect(result.current.isRegenerating).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.canRegenerate).toBe(true);
    expect(result.current.showOverwriteDialog).toBe(false);
    expect(result.current.pendingOverwrite).toBe(false);
  });

  it('재생성 시작 시 올바르게 처리한다', async () => {
    mockRegenerationFunction.mockResolvedValue({ success: true, data: 'test' });
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        onSuccess: mockOnSuccess
      })
    );

    await act(async () => {
      await result.current.startRegeneration(false);
    });

    expect(mockAIStatus.reset).toHaveBeenCalled();
    expect(mockAIStatus.startProcessing).toHaveBeenCalled();
    expect(mockRegenerationFunction).toHaveBeenCalledWith(false);
  });

  it('재생성 성공 시 성공 콜백을 호출한다', async () => {
    const successResult = { success: true, data: 'test' };
    mockRegenerationFunction.mockResolvedValue(successResult);
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        onSuccess: mockOnSuccess
      })
    );

    await act(async () => {
      await result.current.startRegeneration(false);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(successResult);
  });

  it('재생성 실패 시 에러 콜백을 호출한다', async () => {
    const errorResult = { success: false, error: 'Test error' };
    mockRegenerationFunction.mockResolvedValue(errorResult);
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        onError: mockOnError
      })
    );

    await act(async () => {
      await result.current.startRegeneration(false);
    });

    expect(mockOnError).toHaveBeenCalledWith(errorResult);
  });

  it('기존 결과가 있을 때 덮어쓰기 다이얼로그를 표시한다', async () => {
    const hasExistingResult = { success: false, hasExisting: true };
    mockRegenerationFunction.mockResolvedValue(hasExistingResult);
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        showConfirmation: true
      })
    );

    await act(async () => {
      await result.current.startRegeneration(false);
    });

    expect(result.current.showOverwriteDialog).toBe(true);
    expect(result.current.pendingOverwrite).toBe(true);
  });

  it('덮어쓰기 확인 시 재생성을 실행한다', async () => {
    mockRegenerationFunction.mockResolvedValue({ success: true, data: 'test' });
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    // 먼저 다이얼로그를 표시
    await act(async () => {
      await result.current.startRegeneration(false);
    });

    // 덮어쓰기 확인
    await act(async () => {
      await result.current.confirmOverwrite();
    });

    expect(mockRegenerationFunction).toHaveBeenCalledWith(true);
    expect(result.current.showOverwriteDialog).toBe(false);
    expect(result.current.pendingOverwrite).toBe(false);
  });

  it('덮어쓰기 취소 시 다이얼로그를 닫는다', async () => {
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    // 다이얼로그를 표시
    act(() => {
      result.current.handleRegenerateClick();
    });

    expect(result.current.showOverwriteDialog).toBe(true);

    // 취소
    act(() => {
      result.current.cancelOverwrite();
    });

    expect(result.current.showOverwriteDialog).toBe(false);
    expect(result.current.pendingOverwrite).toBe(false);
  });

  it('재생성 버튼 클릭 시 올바르게 처리한다', async () => {
    mockRegenerationFunction.mockResolvedValue({ success: true, data: 'test' });
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        overwrite: true
      })
    );

    await act(async () => {
      result.current.handleRegenerateClick();
    });

    expect(mockRegenerationFunction).toHaveBeenCalledWith(true);
  });

  it('재생성 중에는 재생성할 수 없다', () => {
    mockUseAIStatus.mockReturnValue({
      ...mockAIStatus,
      isLoading: true,
      isProcessing: true,
    });

    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    expect(result.current.canRegenerate).toBe(false);
    expect(result.current.isRegenerating).toBe(true);
  });

  it('에러 메시지를 올바르게 반환한다', () => {
    mockAIStatus.getErrorMessage.mockReturnValue('Test error message');
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    expect(result.current.getErrorMessage()).toBe('Test error message');
  });

  it('재시도 가능 여부를 올바르게 판단한다', () => {
    mockAIStatus.canRetry.mockReturnValue(true);
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction)
    );

    expect(result.current.canRetry()).toBe(true);
  });

  it('재시도 실행 시 재생성을 다시 시도한다', async () => {
    mockRegenerationFunction.mockResolvedValue({ success: true, data: 'test' });
    mockAIStatus.canRetry.mockReturnValue(true);
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        overwrite: true
      })
    );

    await act(async () => {
      result.current.retry();
    });

    expect(mockRegenerationFunction).toHaveBeenCalledWith(true);
  });

  it('showConfirmation이 false일 때 다이얼로그 없이 재생성한다', async () => {
    mockRegenerationFunction.mockResolvedValue({ success: true, data: 'test' });
    
    const { result } = renderHook(() => 
      useRegeneration('summary', mockRegenerationFunction, {
        showConfirmation: false
      })
    );

    await act(async () => {
      result.current.handleRegenerateClick();
    });

    expect(mockRegenerationFunction).toHaveBeenCalledWith(false);
    expect(result.current.showOverwriteDialog).toBe(false);
  });
});
