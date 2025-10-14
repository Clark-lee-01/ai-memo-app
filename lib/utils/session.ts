// lib/utils/session.ts
// 세션 관리 유틸리티 - 세션 정보 추출 및 관리
// AI 메모장 프로젝트의 세션 상태 관리 지원

import { Session } from '@supabase/supabase-js';
import { SessionInfo } from '../types/auth';

export function extractSessionInfo(session: Session | null): SessionInfo {
  if (!session) {
    return {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isExpired: true,
      timeUntilExpiry: null,
    };
  }

  const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
  const now = Date.now();
  const isExpired = expiresAt ? now >= expiresAt : true;
  const timeUntilExpiry = expiresAt ? Math.max(0, expiresAt - now) : null;

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt,
    isExpired,
    timeUntilExpiry,
  };
}

export function isSessionExpiringSoon(sessionInfo: SessionInfo, thresholdMinutes = 5): boolean {
  if (!sessionInfo.timeUntilExpiry) return true;
  return sessionInfo.timeUntilExpiry <= thresholdMinutes * 60 * 1000;
}

export function clearSessionData(): void {
  // 로컬 스토리지 정리
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refresh_token');
  }
}

export function formatTimeUntilExpiry(timeUntilExpiry: number | null): string {
  if (!timeUntilExpiry) return '만료됨';
  
  const minutes = Math.floor(timeUntilExpiry / (60 * 1000));
  const seconds = Math.floor((timeUntilExpiry % (60 * 1000)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
}
