// app/actions/notes.ts
// 노트 Server Actions - 노트 CRUD 작업을 위한 서버 액션
// AI 메모장 프로젝트의 노트 관리 서버 로직

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { notes, users, summaries } from '@/drizzle/schema';
import { eq, and, desc, asc, ilike, count, isNull } from 'drizzle-orm';
import { validateNoteForm, validateNoteUpdate, validateNoteId, validateNoteListOptions } from '@/lib/validations/notes';
import { NoteCreateResult, NoteListResponse } from '@/lib/types/notes';
import { generateSummary, GeminiAPIError } from '@/lib/ai/gemini';

// 노트 생성
export async function createNote(formData: FormData): Promise<NoteCreateResult> {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 폼 데이터 추출 및 유효성 검사
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    const validation = validateNoteForm(rawData);
    
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || '입력 데이터가 유효하지 않습니다',
      };
    }

    const { title, content } = validation.data;

    // 사용자가 users 테이블에 존재하는지 확인하고 없으면 생성
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        email: user.email || '',
      });
    }

    // 노트 생성
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title,
        content: content || null,
      })
      .returning({ id: notes.id });

    // 페이지 재검증
    revalidatePath('/notes');
    
    return {
      success: true,
      noteId: newNote.id,
    };

  } catch (error) {
    console.error('노트 생성 에러:', error);
    return {
      success: false,
      error: '노트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

// 노트 조회
export async function getNote(noteId: string) {
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

    // 노트 조회 (삭제되지 않은 노트만)
    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNull(notes.deletedAt) // 삭제되지 않은 노트만 조회
        )
      )
      .limit(1);

    if (!note) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    return note;

  } catch (error) {
    console.error('노트 조회 에러:', error);
    throw error;
  }
}

// 노트 목록 조회
export async function getNotes(options: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  search?: string;
} = {}): Promise<NoteListResponse> {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }

    // 옵션 유효성 검사
    const optionsValidation = validateNoteListOptions(options);
    if (!optionsValidation.success) {
      throw new Error('유효하지 않은 조회 옵션입니다');
    }

    const { page, limit, sortBy, sortOrder, search } = optionsValidation.data;
    const offset = (page - 1) * limit;

    // 검색 조건 구성 (삭제되지 않은 노트만)
    const whereConditions = [
      eq(notes.userId, user.id),
      isNull(notes.deletedAt) // 삭제되지 않은 노트만 조회
    ];
    if (search) {
      whereConditions.push(
        ilike(notes.title, `%${search}%`)
      );
    }

    // 정렬 조건 구성
    const orderBy = sortOrder === 'asc' 
      ? asc(notes[sortBy])
      : desc(notes[sortBy]);

    // 노트 목록 조회
    const notesList = await db
      .select()
      .from(notes)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(and(...whereConditions));

    const totalCount = totalResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      notes: notesList,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

  } catch (error) {
    console.error('노트 목록 조회 에러:', error);
    throw error;
  }
}

// 노트 업데이트
export async function updateNote(noteId: string, formData: FormData) {
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

    // 폼 데이터 추출 및 유효성 검사
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    const validation = validateNoteUpdate(rawData);
    if (!validation.success) {
      throw new Error(validation.error.errors[0]?.message || '입력 데이터가 유효하지 않습니다');
    }

    const updateData = validation.data;

    // 노트 존재 여부 및 소유권 확인 (삭제되지 않은 노트만)
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNull(notes.deletedAt) // 삭제되지 않은 노트만 조회
        )
      )
      .limit(1);

    if (!existingNote) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    // 노트 업데이트
    const [updatedNote] = await db
      .update(notes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning();

    // 페이지 재검증
    revalidatePath('/notes');
    revalidatePath(`/notes/${noteId}`);

    return updatedNote;

  } catch (error) {
    console.error('노트 업데이트 에러:', error);
    throw error;
  }
}

// 노트 삭제 (소프트 삭제)
export async function deleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다'
      };
    }

    // 노트 ID 유효성 검사
    const idValidation = validateNoteId(noteId);
    if (!idValidation.success) {
      return {
        success: false,
        error: '유효하지 않은 노트 ID입니다'
      };
    }

    // 노트 존재 여부 및 소유권 확인 (삭제되지 않은 노트만)
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNull(notes.deletedAt) // 삭제되지 않은 노트만 조회
        )
      )
      .limit(1);

    if (!existingNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다'
      };
    }

    // 소프트 삭제 (deletedAt과 deletedBy 설정)
    await db
      .update(notes)
      .set({
        deletedAt: new Date(),
        deletedBy: user.id,
      })
      .where(eq(notes.id, noteId));

    // 페이지 재검증
    revalidatePath('/notes');
    
    return {
      success: true,
      message: '노트가 휴지통으로 이동되었습니다'
    };

  } catch (error) {
    console.error('노트 삭제 에러:', error);
    return {
      success: false,
      error: '노트 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };
  }
}

// 노트 요약 생성
export async function generateNoteSummary(noteId: string, overwrite: boolean = false) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다'
      };
    }

    // 노트 ID 유효성 검사
    const idValidation = validateNoteId(noteId);
    if (!idValidation.success) {
      return {
        success: false,
        error: '유효하지 않은 노트 ID입니다'
      };
    }

    // 노트 조회 (삭제되지 않은 노트만)
    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNull(notes.deletedAt)
        )
      )
      .limit(1);

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다'
      };
    }

    // 노트 내용이 있는지 확인
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '요약할 내용이 없습니다. 노트에 본문을 작성해주세요.'
      };
    }

    // 기존 요약 확인
    const [existingSummary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.noteId, noteId),
          eq(summaries.model, 'gemini-2.5-flash')
        )
      )
      .limit(1);

    if (existingSummary && !overwrite) {
      return {
        success: false,
        error: '이미 요약이 존재합니다. 덮어쓰기를 원하시면 확인해주세요.',
        hasExistingSummary: true
      };
    }

    // Gemini API를 사용하여 요약 생성
    const summaryContent = await generateSummary(note.content);

    // 요약을 데이터베이스에 저장 (기존 요약이 있으면 업데이트, 없으면 삽입)
    if (existingSummary) {
      await db
        .update(summaries)
        .set({
          content: summaryContent,
          createdAt: new Date(),
        })
        .where(
          and(
            eq(summaries.noteId, noteId),
            eq(summaries.model, 'gemini-2.5-flash')
          )
        );
    } else {
      await db
        .insert(summaries)
        .values({
          noteId: noteId,
          model: 'gemini-2.5-flash',
          content: summaryContent,
        });
    }

    // 페이지 재검증
    revalidatePath(`/notes/${noteId}`);

    return {
      success: true,
      summary: summaryContent,
      message: existingSummary ? '요약이 업데이트되었습니다' : '요약이 생성되었습니다'
    };

  } catch (error) {
    console.error('노트 요약 생성 에러:', error);
    
    if (error instanceof GeminiAPIError) {
      return {
        success: false,
        error: `AI 요약 생성 중 오류가 발생했습니다: ${error.message}`
      };
    }

    return {
      success: false,
      error: '요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };
  }
}

// 노트 요약 조회
export async function getNoteSummary(noteId: string) {
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

    // 노트 소유권 확인
    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id),
          isNull(notes.deletedAt)
        )
      )
      .limit(1);

    if (!note) {
      throw new Error('노트를 찾을 수 없습니다');
    }

    // 요약 조회
    const [summary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.noteId, noteId),
          eq(summaries.model, 'gemini-2.5-flash')
        )
      )
      .limit(1);

    return summary || null;

  } catch (error) {
    console.error('노트 요약 조회 에러:', error);
    throw error;
  }
}
