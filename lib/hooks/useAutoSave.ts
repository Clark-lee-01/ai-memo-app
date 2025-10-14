// lib/hooks/useAutoSave.ts
// 자동 저장 훅 - 노트 수정 시 실시간 자동 저장 기능
// AI 메모장 프로젝트의 자동 저장 로직

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  debounceMs?: number;
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutoSave({
  data,
  onSave,
  debounceMs = 2000, // 타이핑 중단 후 2초
  intervalMs = 5000, // 5초마다 주기적 저장
  enabled = true,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef(data);
  const isSavingRef = useRef(false);

  // 데이터가 변경되었는지 확인
  const hasDataChanged = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
  }, [data]);

  // 저장 실행
  const performSave = useCallback(async () => {
    if (!enabled || isSavingRef.current || !hasDataChanged()) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus({ status: 'saving' });

    try {
      await onSave(data);
      lastSavedDataRef.current = data;
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date() 
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('자동 저장 실패:', error);
      setSaveStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : '저장 실패'
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, data, onSave, hasDataChanged]);

  // 디바운싱된 저장 (타이핑 중단 후)
  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (hasDataChanged()) {
        performSave();
      }
    }, debounceMs);
  }, [debounceMs, performSave, hasDataChanged]);

  // 주기적 저장
  const startIntervalSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (hasDataChanged()) {
        performSave();
      }
    }, intervalMs);
  }, [intervalMs, performSave, hasDataChanged]);

  // 데이터 변경 감지
  useEffect(() => {
    if (!enabled) return;

    const changed = hasDataChanged();
    setHasUnsavedChanges(changed);

    if (changed) {
      // 디바운싱된 저장 시작
      debouncedSave();
    }
  }, [data, enabled, debouncedSave, hasDataChanged]);

  // 주기적 저장 시작/중지
  useEffect(() => {
    if (enabled) {
      startIntervalSave();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, startIntervalSave]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 수동 저장 (Ctrl+S 등)
  const manualSave = useCallback(async () => {
    if (hasDataChanged()) {
      await performSave();
    }
  }, [performSave, hasDataChanged]);

  // 저장 상태 초기화
  const resetSaveStatus = useCallback(() => {
    setSaveStatus({ status: 'idle' });
    setHasUnsavedChanges(false);
    lastSavedDataRef.current = data;
  }, [data]);

  return {
    saveStatus,
    hasUnsavedChanges,
    manualSave,
    resetSaveStatus,
  };
}
