// components/ui/session-status.tsx
// 세션 상태 표시 컴포넌트 - 세션 정보 및 상태 표시
// AI 메모장 프로젝트의 세션 상태 UI

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { formatTimeUntilExpiry } from '@/lib/utils/session';
import { extractSessionInfo } from '@/lib/utils/session';
import { createBrowserClient } from '@/lib/supabase/client';
import { SessionInfo } from '@/lib/types/auth';
import { useEffect, useState } from 'react';

interface SessionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function SessionStatus({ showDetails = false, className = '' }: SessionStatusProps) {
  const { user, loading, authState } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!user) return;

    const getSessionInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionInfo(extractSessionInfo(session));
      }
    };

    getSessionInfo();
    
    // 30초마다 세션 정보 업데이트
    const interval = setInterval(getSessionInfo, 30000);
    return () => clearInterval(interval);
  }, [user, supabase.auth]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">세션 확인 중...</span>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-gray-600">로그인되지 않음</span>
      </div>
    );
  }

  if (!sessionInfo) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        <span className="text-sm text-gray-600">세션 정보 없음</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        sessionInfo.isExpired 
          ? 'bg-red-500' 
          : sessionInfo.timeUntilExpiry && sessionInfo.timeUntilExpiry < 5 * 60 * 1000
          ? 'bg-yellow-500'
          : 'bg-green-500'
      }`}></div>
      <span className="text-sm text-gray-600">
        {sessionInfo.isExpired 
          ? '세션 만료됨' 
          : `세션 유효 (${formatTimeUntilExpiry(sessionInfo.timeUntilExpiry)})`
        }
      </span>
      {showDetails && (
        <div className="text-xs text-gray-500">
          {user?.email}
        </div>
      )}
    </div>
  );
}
