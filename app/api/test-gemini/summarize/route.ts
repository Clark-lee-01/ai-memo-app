// app/api/test-gemini/summarize/route.ts
// Gemini API 요약 테스트 엔드포인트
// AI 메모장 프로젝트의 Gemini API 테스트용 API
// 관련 파일: lib/ai/gemini.ts, app/test-gemini/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { generateSummary, validateTextLength } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: '텍스트가 필요합니다.'
      }, { status: 400 });
    }

    // 텍스트 길이 검증
    const validation = validateTextLength(text);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error || '텍스트가 너무 깁니다. 8k 토큰 이하로 입력해주세요.'
      }, { status: 400 });
    }

    // Gemini API를 사용하여 요약 생성
    const summary = await generateSummary(text);

    return NextResponse.json({
      success: true,
      summary: summary
    });

  } catch (error) {
    console.error('요약 생성 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '요약 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
