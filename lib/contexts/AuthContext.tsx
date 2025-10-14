// lib/contexts/AuthContext.tsx
// 인증 컨텍스트 - 전역 세션 상태 관리
// AI 메모장 프로젝트의 인증 상태 전역 관리

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { AuthUser, AuthContextType, AuthState } from '@/lib/types/auth';
import { extractSessionInfo, isSessionExpiringSoon } from '@/lib/utils/session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 중 에러:', error);
          setUser(null);
        } else {
          setUser(session?.user as AuthUser || null);
        }
      } catch (error) {
        console.error('세션 확인 중 예외:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user as AuthUser || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // 세션 자동 갱신
  useEffect(() => {
    if (!user) return;

    const checkSessionExpiry = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const sessionInfo = extractSessionInfo(session);
        
        // 세션이 곧 만료될 예정이면 갱신
        if (isSessionExpiringSoon(sessionInfo)) {
          console.log('세션 갱신 중...');
          await supabase.auth.refreshSession();
        }
      }
    };

    // 5분마다 세션 상태 확인
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, supabase.auth]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 에러:', error);
        throw error;
      }
      
      setUser(null);
    } catch (error) {
      console.error('로그아웃 중 예외:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('세션 갱신 에러:', error);
        throw error;
      }
      
      setUser(data.session?.user as AuthUser || null);
    } catch (error) {
      console.error('세션 갱신 중 예외:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  
  return context;
}
