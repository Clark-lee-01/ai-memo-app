// app/api/token-usage/analytics/route.ts
// 토큰 사용량 분석 API 엔드포인트
// 사용량 통계, 트렌드 분석, 사용자별 분석 데이터 제공
// 관련 파일: components/analytics/token-usage-analytics.tsx, lib/monitoring/tokenMonitor.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';

// GET /api/token-usage/analytics - 분석 데이터 조회
export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createServerClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const targetUserId = searchParams.get('userId') || user.id;
    
    // 관리자 권한 확인 (다른 사용자 데이터 조회 시)
    const isAdmin = user.email?.endsWith('@admin.com') || user.email === 'admin@example.com';
    const canViewUserData = targetUserId === user.id || isAdmin;
    
    if (!canViewUserData) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 분석 기간 설정
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    // 토큰 사용량 통계 조회
    const usage = tokenMonitor.getUsage(targetUserId);
    const stats = tokenMonitor['store'].getUsageStats(targetUserId, days);
    
    // 일일 트렌드 데이터 생성
    const dailyTrend = generateDailyTrend(days, targetUserId);
    
    // 시간별 트렌드 데이터 생성
    const hourlyTrend = generateHourlyTrend(days, targetUserId);
    
    // 사용자별 통계 생성 (관리자용)
    const userStats = isAdmin ? await generateUserStats(days) : [];
    
    // 분석 데이터 구성
    const analyticsData = {
      totalUsage: stats.totalUsage,
      averageDaily: stats.averageDaily,
      peakHourly: stats.peakHourly,
      operations: stats.operations,
      dailyTrend,
      hourlyTrend,
      userStats,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('토큰 사용량 분석 오류:', error);
    
    return NextResponse.json(
      { error: '분석 데이터를 조회할 수 없습니다' },
      { status: 500 }
    );
  }
}

// 일일 트렌드 데이터 생성
function generateDailyTrend(days: number, userId?: string): { date: string; usage: number }[] {
  const trend = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 해당 날짜의 사용량 계산 (실제 환경에서는 데이터베이스에서 조회)
    const usage = Math.floor(Math.random() * 1000) + 500; // 임시 데이터
    
    trend.push({
      date: date.toISOString().split('T')[0],
      usage,
    });
  }
  
  return trend;
}

// 시간별 트렌드 데이터 생성
function generateHourlyTrend(days: number, userId?: string): { hour: string; usage: number }[] {
  const trend = [];
  
  for (let hour = 0; hour < 24; hour++) {
    // 해당 시간대의 사용량 계산 (실제 환경에서는 데이터베이스에서 조회)
    const usage = Math.floor(Math.random() * 100) + 50; // 임시 데이터
    
    trend.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      usage,
    });
  }
  
  return trend;
}

// 사용자별 통계 생성 (관리자용)
async function generateUserStats(days: number): Promise<{ userId: string; usage: number; operations: number }[]> {
  // 실제 환경에서는 데이터베이스에서 사용자별 통계를 조회
  // 여기서는 임시 데이터 반환
  return [
    { userId: 'user-1', usage: 1500, operations: 5 },
    { userId: 'user-2', usage: 2300, operations: 8 },
    { userId: 'user-3', usage: 800, operations: 3 },
  ];
}
