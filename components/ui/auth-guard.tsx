// components/ui/auth-guard.tsx
// 인증 가드 컴포넌트 - 인증 상태에 따른 조건부 렌더링
// AI 메모장 프로젝트의 인증 보호 컴포넌트

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true, 
  requireOnboarding = false 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated, isOnboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">이 페이지에 접근하려면 로그인해주세요.</p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/auth/signin">로그인</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireOnboarding && isAuthenticated && !isOnboardingCompleted) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">온보딩이 필요합니다</h2>
          <p className="text-gray-600 mb-6">서비스를 이용하려면 온보딩을 완료해주세요.</p>
          <Button asChild>
            <Link href="/onboarding">온보딩 시작</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
