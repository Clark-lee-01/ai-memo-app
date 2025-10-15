// app/api/token-usage/route.ts
// 토큰 사용량 API 엔드포인트
// 사용자별 토큰 사용량 조회 및 관리
// 관련 파일: lib/monitoring/tokenMonitor.ts, components/dashboard/token-usage-dashboard.tsx

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';

// GET /api/token-usage - 토큰 사용량 조회
export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성
    const supabase = createServerClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 토큰 사용량 데이터 조회
    const usageData = tokenMonitor.getUsage(user.id);

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('토큰 사용량 조회 오류:', error);
    
    return NextResponse.json(
      { error: '토큰 사용량을 조회할 수 없습니다' },
      { status: 500 }
    );
  }
}

// POST /api/token-usage - 토큰 사용량 기록
export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성
    const supabase = createServerClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { input, output, operation } = body;

    // 입력 검증
    if (typeof input !== 'number' || typeof output !== 'number' || !operation) {
      return NextResponse.json(
        { error: '잘못된 요청 데이터입니다' },
        { status: 400 }
      );
    }

    // 토큰 사용량 기록
    tokenMonitor.recordUsage({
      input,
      output,
      total: input + output,
      operation,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('토큰 사용량 기록 오류:', error);
    
    return NextResponse.json(
      { error: '토큰 사용량을 기록할 수 없습니다' },
      { status: 500 }
    );
  }
}

// PUT /api/token-usage - 토큰 제한 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성
    const supabase = createServerClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { daily, hourly, perRequest, warningThreshold } = body;

    // 입력 검증
    if (typeof daily !== 'number' || typeof hourly !== 'number' || 
        typeof perRequest !== 'number' || typeof warningThreshold !== 'number') {
      return NextResponse.json(
        { error: '잘못된 요청 데이터입니다' },
        { status: 400 }
      );
    }

    // 토큰 제한 설정 업데이트
    tokenMonitor.updateLimits({
      daily,
      hourly,
      perRequest,
      warningThreshold,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('토큰 제한 설정 업데이트 오류:', error);
    
    return NextResponse.json(
      { error: '토큰 제한 설정을 업데이트할 수 없습니다' },
      { status: 500 }
    );
  }
}
