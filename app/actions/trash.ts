// app/actions/trash.ts
// 휴지통 Server Actions - 삭제된 노트 관리 서버 액션
// AI 메모장 프로젝트의 휴지통 기능 서버 로직

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { notes } from '@/drizzle/schema';
import { eq, and, desc, isNotNull, lt, count } from 'drizzle-orm';
import { validateNoteId } from '@/lib/validations/notes';

// 휴지통 노트 목록 조회
export async function getTrashNotes(options: {
  page?: number;
  limit?: number;
} = {}) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }

    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // 삭제된 노트 목록 조회
    const trashNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt) // 삭제된 노트만 조회
        )
      )
      .orderBy(desc(notes.deletedAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt)
        )
      );

    const totalCount = totalResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      notes: trashNotes,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

  } catch (error) {
    console.error('휴지통 노트 조회 에러:', error);
    throw error;
  }
}

// 노트 복구
export async function restoreNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }

    // 노트 ID 유효성 검사
    const idValidation = validateNoteId(noteId);
    if (!idValidation.success) {
      throw new Error('유효하지 않은 노트 ID입니다');
    }

    // 삭제된 노트 존재 여부 및 소유권 확인
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt) // 삭제된 노트만 조회
        )
      )
      .limit(1);

    if (!existingNote) {
      throw new Error('휴지통에서 노트를 찾을 수 없습니다');
    }

    // 노트 복구 (deletedAt과 deletedBy를 null로 설정)
    await db
      .update(notes)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    // 페이지 재검증
    revalidatePath('/trash');
    revalidatePath('/notes');

  } catch (error) {
    console.error('노트 복구 에러:', error);
    throw error;
  }
}

// 노트 영구 삭제
export async function permanentlyDeleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }

    // 노트 ID 유효성 검사
    const idValidation = validateNoteId(noteId);
    if (!idValidation.success) {
      throw new Error('유효하지 않은 노트 ID입니다');
    }

    // 삭제된 노트 존재 여부 및 소유권 확인
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt) // 삭제된 노트만 조회
        )
      )
      .limit(1);

    if (!existingNote) {
      throw new Error('휴지통에서 노트를 찾을 수 없습니다');
    }

    // 노트 영구 삭제
    await db
      .delete(notes)
      .where(eq(notes.id, noteId));

    // 페이지 재검증
    revalidatePath('/trash');

  } catch (error) {
    console.error('노트 영구 삭제 에러:', error);
    throw error;
  }
}

// 휴지통 비우기
export async function emptyTrash() {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }

    // 사용자의 모든 삭제된 노트 영구 삭제
    const result = await db
      .delete(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt)
        )
      )
      .returning({ id: notes.id });

    // 페이지 재검증
    revalidatePath('/trash');

    return {
      deletedCount: result.length,
    };

  } catch (error) {
    console.error('휴지통 비우기 에러:', error);
    throw error;
  }
}

// 30일 경과 노트 자동 영구 삭제 (크론잡용)
export async function cleanupExpiredNotes() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 30일 경과된 삭제된 노트 조회
    const expiredNotes = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(
        and(
          isNotNull(notes.deletedAt),
          lt(notes.deletedAt, thirtyDaysAgo)
        )
      );

    if (expiredNotes.length === 0) {
      return { deletedCount: 0 };
    }

    // 영구 삭제
    const result = await db
      .delete(notes)
      .where(
        and(
          isNotNull(notes.deletedAt),
          lt(notes.deletedAt, thirtyDaysAgo)
        )
      )
      .returning({ id: notes.id, userId: notes.userId });

    console.log(`자동 정리 완료: ${result.length}개의 노트가 영구 삭제되었습니다`);

    return {
      deletedCount: result.length,
      deletedNotes: result,
    };

  } catch (error) {
    console.error('자동 정리 에러:', error);
    throw error;
  }
}
