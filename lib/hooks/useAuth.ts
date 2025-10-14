// lib/hooks/useAuth.ts
// useAuth 훅 - 인증 상태 및 세션 관리
// AI 메모장 프로젝트의 인증 훅

'use client';

import { useAuth as useAuthContext } from '@/lib/contexts/AuthContext';
import { AuthState } from '@/lib/types/auth';

export function useAuth() {
  const { user, loading, signOut, refreshSession } = useAuthContext();
  
  const getAuthState = (): AuthState => {
    if (loading) return 'loading';
    return user ? 'authenticated' : 'unauthenticated';
  };

  const isAuthenticated = user !== null;
  const isOnboardingCompleted = user?.onboarding_completed ?? false;

  return {
    user,
    loading,
    authState: getAuthState(),
    isAuthenticated,
    isOnboardingCompleted,
    signOut,
    refreshSession,
  };
}
