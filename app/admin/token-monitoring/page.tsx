// app/admin/token-monitoring/page.tsx
// 관리자용 토큰 모니터링 대시보드 페이지
// 전체 시스템의 토큰 사용량을 모니터링하고 관리
// 관련 파일: components/dashboard/token-usage-dashboard.tsx, lib/monitoring/tokenMonitor.ts

import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TokenUsageDashboard from '@/components/dashboard/token-usage-dashboard';
import TokenLimitSettings from '@/components/settings/token-limit-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BarChart3, Settings, AlertTriangle } from 'lucide-react';

// 관리자 권한 확인
async function checkAdminAccess() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/signin');
  }

  // 관리자 권한 확인 (실제 환경에서는 사용자 역할을 확인)
  // 여기서는 간단히 이메일로 확인
  const isAdmin = user.email?.endsWith('@admin.com') || user.email === 'admin@example.com';
  
  if (!isAdmin) {
    redirect('/');
  }

  return user;
}

// 로딩 스켈레톤 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 관리자용 토큰 모니터링 대시보드 페이지
export default async function AdminTokenMonitoringPage() {
  const user = await checkAdminAccess();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">토큰 사용량 모니터링</h1>
        <p className="text-muted-foreground">
          전체 시스템의 AI 토큰 사용량을 모니터링하고 관리합니다
        </p>
      </div>

      {/* 관리자 전용 알림 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            관리자 전용 기능
          </CardTitle>
          <CardDescription className="text-amber-700">
            이 페이지는 관리자만 접근할 수 있습니다. 시스템 전체의 토큰 사용량을 모니터링하고 제한을 설정할 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 대시보드 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">사용량 대시보드</h2>
        </div>
        
        <Suspense fallback={<DashboardSkeleton />}>
          <TokenUsageDashboard userId={user.id} />
        </Suspense>
      </div>

      {/* 설정 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">시스템 설정</h2>
        </div>
        
        <Suspense fallback={<DashboardSkeleton />}>
          <TokenLimitSettings userId={user.id} />
        </Suspense>
      </div>

      {/* 사용자 관리 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">사용자 관리</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>사용자별 토큰 사용량</CardTitle>
            <CardDescription>
              개별 사용자의 토큰 사용량을 조회하고 관리할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                사용자별 상세 관리 기능은 추후 구현 예정입니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시스템 정보 섹션 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">시스템 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">정상 작동</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">모니터링 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">활성화됨</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
