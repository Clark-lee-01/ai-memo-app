// __tests__/hooks/useAIStatus.test.ts
// useAIStatus 훅 테스트 - AI 상태 관리 기능 검증
// AI 메모장 프로젝트의 AI 상태 관리 커스텀 훅 테스트
// 관련 파일: lib/hooks/useAIStatus.ts

import { renderHook, act } from '@testing-library/react';
import { useAIStatus } from '@/lib/hooks/useAIStatus';

describe('useAIStatus', () => {
  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() => useAIStatus());

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.errorType).toBeNull();
    expect(result.current.processingTime).toBeNull();
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isProcessing).toBe(false);
  });

  it('AI 처리 시작 시 로딩 상태로 변경된다', () => {
    const { result } = renderHook(() => useAIStatus());

    act(() => {
      result.current.startProcessing();
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.startTime).not.toBeNull();
  });

  it('AI 처리 성공 시 성공 상태로 변경된다', () => {
    const { result } = renderHook(() => useAIStatus());

    act(() => {
      result.current.startProcessing();
    });

    act(() => {
      result.current.markSuccess();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.endTime).not.toBeNull();
    expect(result.current.processingTime).not.toBeNull();
  });

  it('AI 처리 에러 시 에러 상태로 변경된다', () => {
    const { result } = renderHook(() => useAIStatus());
    const testError = new Error('Test error');

    act(() => {
      result.current.startProcessing();
    });

    act(() => {
      result.current.markError(testError);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    expect(result.current.errorType).toBe('unknown');
    expect(result.current.endTime).not.toBeNull();
  });

  it('네트워크 에러를 올바르게 처리한다', () => {
    const { result } = renderHook(() => useAIStatus());
    const networkError = new Error('네트워크 연결 실패');

    act(() => {
      result.current.markError(networkError);
    });

    expect(result.current.error).toBe('네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.');
    expect(result.current.errorType).toBe('network');
    expect(result.current.canRetry()).toBe(true);
  });

  it('API 제한 에러를 올바르게 처리한다', () => {
    const { result } = renderHook(() => useAIStatus());
    const apiError = new Error('API rate limit exceeded');

    act(() => {
      result.current.markError(apiError);
    });

    expect(result.current.error).toBe('API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.');
    expect(result.current.errorType).toBe('api_limit');
    expect(result.current.canRetry()).toBe(true);
  });

  it('토큰 제한 에러를 올바르게 처리한다', () => {
    const { result } = renderHook(() => useAIStatus());
    const tokenError = new Error('토큰 제한 초과');

    act(() => {
      result.current.markError(tokenError);
    });

    expect(result.current.error).toBe('텍스트가 너무 깁니다. 내용을 줄여서 다시 시도해주세요.');
    expect(result.current.errorType).toBe('token_limit');
    expect(result.current.canRetry()).toBe(false);
  });

  it('상태 리셋이 올바르게 작동한다', () => {
    const { result } = renderHook(() => useAIStatus());

    // 에러 상태로 설정
    act(() => {
      result.current.startProcessing();
      result.current.markError(new Error('Test error'));
    });

    expect(result.current.isError).toBe(true);

    // 리셋
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.errorType).toBeNull();
    expect(result.current.isIdle).toBe(true);
  });

  it('처리 시간을 올바르게 계산한다', () => {
    const { result } = renderHook(() => useAIStatus());

    act(() => {
      result.current.startProcessing();
    });

    // 시간이 지나간 후 성공 처리
    act(() => {
      result.current.markSuccess();
    });

    expect(result.current.processingTime).toBeGreaterThanOrEqual(0);
    expect(typeof result.current.processingTime).toBe('number');
  });

  it('에러 메시지를 올바르게 반환한다', () => {
    const { result } = renderHook(() => useAIStatus());
    const testError = new Error('Test error');

    act(() => {
      result.current.markError(testError);
    });

    expect(result.current.getErrorMessage()).toBe('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  });

  it('에러 타입을 올바르게 반환한다', () => {
    const { result } = renderHook(() => useAIStatus());
    const networkError = new Error('네트워크 오류');

    act(() => {
      result.current.markError(networkError);
    });

    expect(result.current.getErrorType()).toBe('network');
  });

  it('재시도 가능 여부를 올바르게 판단한다', () => {
    const { result } = renderHook(() => useAIStatus());

    // 토큰 제한 에러는 재시도 불가
    act(() => {
      result.current.markError(new Error('토큰 제한'));
    });
    expect(result.current.canRetry()).toBe(false);

    // 네트워크 에러는 재시도 가능
    act(() => {
      result.current.markError(new Error('네트워크 오류'));
    });
    expect(result.current.canRetry()).toBe(true);

    // 에러가 없으면 재시도 불가
    act(() => {
      result.current.reset();
    });
    expect(result.current.canRetry()).toBe(false);
  });
});
