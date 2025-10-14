// app/api/cleanup/route.ts
// 자동 정리 API 엔드포인트 - 30일 경과 노트 영구 삭제
// AI 메모장 프로젝트의 자동 정리 API

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredNotes } from '@/app/actions/trash';

export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (선택적 - 보안을 위해)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_API_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 자동 정리 실행
    const result = await cleanupExpiredNotes();

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount}개의 노트가 자동 정리되었습니다.`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error('자동 정리 API 에러:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '자동 정리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET 요청으로도 실행 가능 (테스트용)
export async function GET(request: NextRequest) {
  return POST(request);
}
