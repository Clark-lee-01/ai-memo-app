// lib/types/auth.ts
// 인증 관련 타입 정의 - 세션 상태 및 사용자 정보 타입
// AI 메모장 프로젝트의 인증 시스템 타입 안전성 보장

import { User } from '@supabase/supabase-js';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUser extends User {
  onboarding_completed?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface SessionInfo {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  timeUntilExpiry: number | null;
}
