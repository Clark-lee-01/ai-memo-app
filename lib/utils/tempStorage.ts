// lib/utils/tempStorage.ts
// 임시 저장 데이터 관리 유틸리티 - 로컬 스토리지에 임시 저장된 노트 데이터 관리
// AI 메모장 프로젝트의 임시 저장 기능

export interface TempStorageData {
  data: {
    title: string;
    content: string;
  };
  timestamp: string;
  userId: string;
  noteId?: string; // 수정 모드일 때 노트 ID
}

/**
 * 현재 사용자 ID를 가져옵니다 (실제 구현에서는 인증 컨텍스트에서 가져와야 함)
 */
function getCurrentUserId(): string {
  // 브라우저 환경에서만 localStorage 접근
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId') || 'anonymous';
  }
  return 'anonymous';
}

/**
 * 임시 저장 데이터를 로컬 스토리지에 저장합니다
 */
export function saveTempData(
  storageKey: string, 
  data: { title: string; content: string },
  noteId?: string
): void {
  try {
    const tempData: TempStorageData = {
      data,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      noteId
    };

    localStorage.setItem(storageKey, JSON.stringify(tempData));
    console.log('임시 저장 완료:', storageKey);
  } catch (error) {
    console.error('임시 저장 실패:', error);
  }
}

/**
 * 로컬 스토리지에서 임시 저장 데이터를 가져옵니다
 */
export function getTempData(storageKey: string): TempStorageData | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const parsed: TempStorageData = JSON.parse(stored);
    
    // 24시간 이내 데이터만 유효
    const storedTime = new Date(parsed.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      localStorage.removeItem(storageKey);
      console.log('만료된 임시 저장 데이터 삭제:', storageKey);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('임시 저장 데이터 읽기 실패:', error);
    return null;
  }
}

/**
 * 임시 저장 데이터를 삭제합니다
 */
export function clearTempData(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
    console.log('임시 저장 데이터 삭제:', storageKey);
  } catch (error) {
    console.error('임시 저장 데이터 삭제 실패:', error);
  }
}

/**
 * 임시 저장 데이터가 있는지 확인합니다
 */
export function hasTempData(storageKey: string): boolean {
  return getTempData(storageKey) !== null;
}

/**
 * 사용자별 임시 저장 키를 생성합니다
 */
export function createTempStorageKey(noteId?: string): string {
  const userId = getCurrentUserId();
  const key = noteId ? `temp-note-${noteId}` : 'temp-note-new';
  return `${userId}-${key}`;
}

/**
 * 모든 임시 저장 데이터를 정리합니다 (사용자별)
 */
export function clearAllTempData(): void {
  try {
    const userId = getCurrentUserId();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(`${userId}-temp-note-`)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('모든 임시 저장 데이터 정리 완료');
  } catch (error) {
    console.error('임시 저장 데이터 정리 실패:', error);
  }
}

/**
 * 만료된 임시 저장 데이터를 정리합니다
 */
export function cleanupExpiredTempData(): void {
  try {
    const userId = getCurrentUserId();
    const keys = Object.keys(localStorage);
    const now = new Date();
    
    keys.forEach(key => {
      if (key.startsWith(`${userId}-temp-note-`)) {
        const tempData = getTempData(key);
        if (tempData) {
          const storedTime = new Date(tempData.timestamp);
          const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            localStorage.removeItem(key);
            console.log('만료된 임시 저장 데이터 삭제:', key);
          }
        }
      }
    });
  } catch (error) {
    console.error('만료된 임시 저장 데이터 정리 실패:', error);
  }
}
