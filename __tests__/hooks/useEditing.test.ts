// __tests__/hooks/useEditing.test.ts
// useEditing 훅 테스트 - 편집 기능 커스텀 훅 테스트
// AI 메모장 프로젝트의 편집 기능 테스트
// 관련 파일: lib/hooks/useEditing.ts

import { renderHook, act } from '@testing-library/react';
import { useEditing } from '@/lib/hooks/useEditing';

// useAIStatus 모킹
jest.mock('@/lib/hooks/useAIStatus', () => ({
  useAIStatus: () => ({
    isLoading: false,
    isError: false,
    isSuccess: false,
    reset: jest.fn(),
    startProcessing: jest.fn(),
    markSuccess: jest.fn(),
    markError: jest.fn(),
    getErrorMessage: jest.fn(() => ''),
    canRetry: jest.fn(() => false),
  }),
}));

describe('useEditing', () => {
  const mockUpdateFunction = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 상태가 올바르게 설정된다', () => {
    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    expect(result.current.isEditing).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.canSave).toBe(false);
    expect(result.current.canCancel).toBe(true);
    expect(result.current.originalData).toBe(null);
    expect(result.current.editedData).toBe(null);
  });

  it('편집을 시작할 수 있다', () => {
    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.originalData).toEqual(testData);
    expect(result.current.editedData).toEqual(testData);
    expect(result.current.hasChanges).toBe(false);
  });

  it('편집을 취소할 수 있다', () => {
    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.originalData).toBe(null);
    expect(result.current.hasChanges).toBe(false);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('데이터 변경을 감지할 수 있다', () => {
    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const originalData = { content: 'original content' };
    const newData = { content: 'new content' };

    act(() => {
      result.current.startEditing(originalData);
    });

    act(() => {
      result.current.handleDataChange(newData);
    });

    expect(result.current.editedData).toEqual(newData);
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.canSave).toBe(true);
  });

  it('편집을 저장할 수 있다', async () => {
    const mockResult = { success: true, summary: { content: 'saved content' } };
    mockUpdateFunction.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    act(() => {
      result.current.handleDataChange({ content: 'modified content' });
    });

    await act(async () => {
      await result.current.saveEditing();
    });

    expect(mockUpdateFunction).toHaveBeenCalledWith({ content: 'modified content' });
    expect(mockOnSave).toHaveBeenCalledWith(mockResult);
  });

  it('저장 실패 시 에러를 처리한다', async () => {
    const mockError = { success: false, error: 'Save failed' };
    mockUpdateFunction.mockResolvedValue(mockError);

    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    act(() => {
      result.current.handleDataChange({ content: 'modified content' });
    });

    await act(async () => {
      await result.current.saveEditing();
    });

    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('변경사항이 없으면 저장하지 않는다', async () => {
    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    // 변경사항 없이 저장 시도
    await act(async () => {
      await result.current.saveEditing();
    });

    expect(mockUpdateFunction).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('재시도 기능이 작동한다', async () => {
    const mockResult = { success: true, summary: { content: 'saved content' } };
    mockUpdateFunction.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useEditing('summary', mockUpdateFunction, {
        onSave: mockOnSave,
        onCancel: mockOnCancel,
        onError: mockOnError,
      })
    );

    const testData = { content: 'test content' };

    act(() => {
      result.current.startEditing(testData);
    });

    act(() => {
      result.current.handleDataChange({ content: 'modified content' });
    });

    // canRetry가 true를 반환하도록 설정
    const mockCanRetry = jest.fn(() => true);
    result.current.canRetry = mockCanRetry;

    await act(async () => {
      await result.current.retry();
    });

    expect(mockUpdateFunction).toHaveBeenCalledWith({ content: 'modified content' });
  });
});
