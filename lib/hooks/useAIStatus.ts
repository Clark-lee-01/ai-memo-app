// lib/hooks/useAIStatus.ts
// AI 처리 상태 관리 훅 - 로딩, 성공, 에러 상태를 통합 관리
// AI 메모장 프로젝트의 AI 상태 관리 커스텀 훅
// 관련 파일: components/notes/summary-section.tsx, components/notes/tags-section.tsx

'use client';

import { useState, useCallback } from 'react';

// AI 상태 타입 정의
export type AIStatus = 'idle' | 'loading' | 'success' | 'error';

// 에러 타입 정의
export type AIErrorType = 'network' | 'api_limit' | 'token_limit' | 'unknown';

// AI 상태 인터페이스
export interface AIStatusState {
  status: AIStatus;
  error: string | null;
  errorType: AIErrorType | null;
  startTime: number | null;
  endTime: number | null;
}

// AI 상태 액션 타입
export type AIStatusAction = 
  | { type: 'START' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string; errorType: AIErrorType }
  | { type: 'RESET' };

// AI 상태 리듀서
function aiStatusReducer(state: AIStatusState, action: AIStatusAction): AIStatusState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: 'loading',
        error: null,
        errorType: null,
        startTime: Date.now(),
        endTime: null,
      };
    case 'SUCCESS':
      return {
        ...state,
        status: 'success',
        error: null,
        errorType: null,
        endTime: Date.now(),
      };
    case 'ERROR':
      return {
        ...state,
        status: 'error',
        error: action.error,
        errorType: action.errorType,
        endTime: Date.now(),
      };
    case 'RESET':
      return {
        status: 'idle',
        error: null,
        errorType: null,
        startTime: null,
        endTime: null,
      };
    default:
      return state;
  }
}

// 에러 메시지 생성 함수
function createErrorMessage(error: { message?: string }): { message: string; type: AIErrorType } {
  if (error?.message?.includes('네트워크') || error?.message?.includes('Network')) {
    return {
      message: '네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.',
      type: 'network'
    };
  }
  
  if (error?.message?.includes('API') || error?.message?.includes('rate limit')) {
    return {
      message: 'API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      type: 'api_limit'
    };
  }
  
  if (error?.message?.includes('토큰') || error?.message?.includes('token')) {
    return {
      message: '텍스트가 너무 깁니다. 내용을 줄여서 다시 시도해주세요.',
      type: 'token_limit'
    };
  }
  
  return {
    message: '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    type: 'unknown'
  };
}

// 처리 시간 계산 함수
function getProcessingTime(startTime: number | null, endTime: number | null): number | null {
  if (!startTime || !endTime) return null;
  return Math.round((endTime - startTime) / 1000);
}

// useAIStatus 훅
export function useAIStatus() {
  const [state, setState] = useState<AIStatusState>({
    status: 'idle',
    error: null,
    errorType: null,
    startTime: null,
    endTime: null,
  });

  // AI 처리 시작
  const startProcessing = useCallback(() => {
    setState(prev => aiStatusReducer(prev, { type: 'START' }));
  }, []);

  // AI 처리 성공
  const markSuccess = useCallback(() => {
    setState(prev => aiStatusReducer(prev, { type: 'SUCCESS' }));
  }, []);

  // AI 처리 에러
  const markError = useCallback((error: { message?: string }) => {
    const { message, type } = createErrorMessage(error);
    setState(prev => aiStatusReducer(prev, { type: 'ERROR', error: message, errorType: type }));
  }, []);

  // 상태 리셋
  const reset = useCallback(() => {
    setState(prev => aiStatusReducer(prev, { type: 'RESET' }));
  }, []);

  // 처리 시간 계산
  const processingTime = getProcessingTime(state.startTime, state.endTime);

  // 상태별 유틸리티 함수들
  const isIdle = state.status === 'idle';
  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';
  const isProcessing = isLoading || isSuccess;

  // 에러 메시지 가져오기
  const getErrorMessage = useCallback(() => {
    if (!isError) return null;
    return state.error;
  }, [isError, state.error]);

  // 에러 타입 가져오기
  const getErrorType = useCallback(() => {
    if (!isError) return null;
    return state.errorType;
  }, [isError, state.errorType]);

  // 재시도 가능 여부 확인
  const canRetry = useCallback(() => {
    return isError && state.errorType !== 'token_limit';
  }, [isError, state.errorType]);

  return {
    // 상태
    status: state.status,
    error: state.error,
    errorType: state.errorType,
    processingTime,
    
    // 상태 체크 함수들
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isProcessing,
    
    // 액션 함수들
    startProcessing,
    markSuccess,
    markError,
    reset,
    
    // 유틸리티 함수들
    getErrorMessage,
    getErrorType,
    canRetry,
  };
}
