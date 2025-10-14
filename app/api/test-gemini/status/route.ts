// app/api/test-gemini/status/route.ts
// Gemini API 상태 확인 테스트 엔드포인트
// AI 메모장 프로젝트의 Gemini API 테스트용 API
// 관련 파일: lib/ai/gemini.ts, app/test-gemini/page.tsx

import { NextResponse } from 'next/server';
import { checkAPIStatus } from '@/lib/ai/gemini';

export async function GET() {
  try {
    // Gemini API 상태 확인
    const status = await checkAPIStatus();

    return NextResponse.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('API 상태 확인 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API 상태 확인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
