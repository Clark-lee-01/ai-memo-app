// lib/hooks/useRegeneration.ts
// AI 결과 재생성 기능을 위한 커스텀 훅 - 요약/태그 재생성 로직 통합
// AI 메모장 프로젝트의 재생성 기능 관리 커스텀 훅
// 관련 파일: components/notes/summary-section.tsx, components/notes/tags-section.tsx

'use client';

import { useState, useCallback } from 'react';
import { useAIStatus } from './useAIStatus';

// 재생성 타입 정의
export type RegenerationType = 'summary' | 'tags';

// 재생성 옵션 정의
export interface RegenerationOptions {
  overwrite?: boolean;
  showConfirmation?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

// 재생성 함수 타입 정의
export type RegenerationFunction = (overwrite: boolean) => Promise<any>;

// useRegeneration 훅
export function useRegeneration(
  type: RegenerationType,
  regenerationFunction: RegenerationFunction,
  options: RegenerationOptions = {}
) {
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(false);
  const aiStatus = useAIStatus();

  const {
    overwrite = false,
    showConfirmation = true,
    onSuccess,
    onError
  } = options;

  // 재생성 시작
  const startRegeneration = useCallback(async (forceOverwrite: boolean = false) => {
    try {
      aiStatus.reset();
      aiStatus.startProcessing();

      const result = await regenerationFunction(forceOverwrite);
      
      if (result.success) {
        aiStatus.markSuccess();
        onSuccess?.(result);
      } else {
        // 기존 결과가 있는 경우 덮어쓰기 확인
        if (result.hasExisting && showConfirmation) {
          setShowOverwriteDialog(true);
          setPendingOverwrite(true);
          aiStatus.reset();
        } else {
          aiStatus.markError(new Error(result.error || '재생성에 실패했습니다.'));
          onError?.(result);
        }
      }
    } catch (error) {
      aiStatus.markError(error);
      onError?.(error);
    }
  }, [regenerationFunction, showConfirmation, onSuccess, onError, aiStatus]);

  // 덮어쓰기 확인
  const confirmOverwrite = useCallback(async () => {
    setShowOverwriteDialog(false);
    setPendingOverwrite(false);
    await startRegeneration(true);
  }, [startRegeneration]);

  // 덮어쓰기 취소
  const cancelOverwrite = useCallback(() => {
    setShowOverwriteDialog(false);
    setPendingOverwrite(false);
    aiStatus.reset();
  }, [aiStatus]);

  // 재생성 버튼 클릭 핸들러
  const handleRegenerateClick = useCallback(() => {
    if (overwrite || !showConfirmation) {
      startRegeneration(overwrite);
    } else {
      setShowOverwriteDialog(true);
    }
  }, [startRegeneration, overwrite, showConfirmation]);

  // 재생성 상태 확인
  const isRegenerating = aiStatus.isLoading;
  const hasError = aiStatus.isError;
  const isSuccess = aiStatus.isSuccess;
  const canRegenerate = !isRegenerating && !pendingOverwrite;

  // 에러 메시지 가져오기
  const getErrorMessage = useCallback(() => {
    return aiStatus.getErrorMessage();
  }, [aiStatus]);

  // 재시도 가능 여부 확인
  const canRetry = useCallback(() => {
    return aiStatus.canRetry();
  }, [aiStatus]);

  // 재시도 실행
  const retry = useCallback(() => {
    if (canRetry()) {
      startRegeneration(overwrite);
    }
  }, [startRegeneration, overwrite, canRetry]);

  return {
    // 상태
    isRegenerating,
    hasError,
    isSuccess,
    canRegenerate,
    showOverwriteDialog,
    pendingOverwrite,
    
    // 액션
    startRegeneration,
    handleRegenerateClick,
    confirmOverwrite,
    cancelOverwrite,
    retry,
    
    // 유틸리티
    getErrorMessage,
    canRetry,
    
    // AI 상태 (직접 접근용)
    aiStatus
  };
}
