// app/api/token-usage/check/route.ts
// 토큰 사용량 제한 확인 API 엔드포인트
// AI 기능 사용 전 토큰 제한을 확인하는 API
// 관련 파일: lib/middleware/tokenLimitMiddleware.ts, components/ui/token-limit-guard.tsx

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkTokenLimit } from '@/lib/middleware/tokenLimitMiddleware';

// POST /api/token-usage/check - 토큰 제한 확인
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
    const { estimatedTokens, operation, userId } = body;

    // 입력 검증
    if (typeof estimatedTokens !== 'number' || !operation) {
      return NextResponse.json(
        { error: '잘못된 요청 데이터입니다' },
        { status: 400 }
      );
    }

    // 토큰 제한 확인
    const result = await checkTokenLimit(
      estimatedTokens,
      operation,
      userId || user.id
    );

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          error: result.error?.message,
          code: result.error?.code,
          category: result.error?.category,
          severity: result.error?.severity,
          tokenUsage: result.error?.tokenUsage,
          warnings: result.warnings,
        },
        { status: 429 } // Too Many Requests
      );
    }

    return NextResponse.json({
      allowed: true,
      warnings: result.warnings,
    });

  } catch (error) {
    console.error('토큰 제한 확인 오류:', error);
    
    return NextResponse.json(
      { error: '토큰 제한을 확인할 수 없습니다' },
      { status: 500 }
    );
  }
}
