// lib/hooks/useEditing.ts
// AI 결과 편집 기능을 위한 커스텀 훅 - 요약/태그 편집 로직 통합
// AI 메모장 프로젝트의 편집 기능 관리 커스텀 훅
// 관련 파일: components/notes/summary-section.tsx, components/notes/tags-section.tsx

'use client';

import { useState, useCallback } from 'react';
import { useAIStatus } from './useAIStatus';

// 편집 타입 정의
export type EditingType = 'summary' | 'tags';

// 편집 상태 정의
export type EditingStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'cancelled';

// 편집 옵션 정의
export interface EditingOptions {
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

// 편집 함수 타입 정의
export type EditingFunction = (data: any) => Promise<any>;

// useEditing 훅
export function useEditing(
  type: EditingType,
  updateFunction: EditingFunction,
  options: EditingOptions = {}
) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const aiStatus = useAIStatus();

  const {
    onSave,
    onCancel,
    onError
  } = options;

  // 편집 시작
  const startEditing = useCallback((data: any) => {
    setOriginalData(data);
    setEditedData(data);
    setIsEditing(true);
    setHasChanges(false);
    aiStatus.reset();
  }, [aiStatus]);

  // 편집 취소
  const cancelEditing = useCallback(() => {
    setEditedData(originalData);
    setIsEditing(false);
    setHasChanges(false);
    setOriginalData(null);
    aiStatus.reset();
    onCancel?.();
  }, [originalData, aiStatus, onCancel]);

  // 데이터 변경 감지
  const handleDataChange = useCallback((newData: any) => {
    setEditedData(newData);
    const hasChanges = JSON.stringify(newData) !== JSON.stringify(originalData);
    setHasChanges(hasChanges);
  }, [originalData]);

  // 편집 저장
  const saveEditing = useCallback(async () => {
    if (!hasChanges) {
      cancelEditing();
      return;
    }

    try {
      aiStatus.reset();
      aiStatus.startProcessing();

      const result = await updateFunction(editedData);
      
      if (result.success) {
        aiStatus.markSuccess();
        setIsEditing(false);
        setHasChanges(false);
        setOriginalData(null);
        onSave?.(result);
      } else {
        aiStatus.markError(new Error(result.error || '편집 저장에 실패했습니다.'));
        onError?.(result);
      }
    } catch (error) {
      aiStatus.markError(error);
      onError?.(error);
    }
  }, [editedData, hasChanges, updateFunction, aiStatus, onSave, onError, cancelEditing]);

  // 편집 상태 확인
  const isSaving = aiStatus.isLoading;
  const hasError = aiStatus.isError;
  const isSuccess = aiStatus.isSuccess;
  const canSave = hasChanges && !isSaving;
  const canCancel = !isSaving;

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
      saveEditing();
    }
  }, [saveEditing, canRetry]);

  return {
    // 상태
    isEditing,
    isSaving,
    hasError,
    isSuccess,
    hasChanges,
    canSave,
    canCancel,
    originalData,
    editedData,
    
    // 액션
    startEditing,
    cancelEditing,
    saveEditing,
    handleDataChange,
    retry,
    
    // 유틸리티
    getErrorMessage,
    canRetry,
    
    // AI 상태 (직접 접근용)
    aiStatus
  };
}
