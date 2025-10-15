// __tests__/actions/notes-editing.test.ts
// 노트 편집 서버 액션 테스트 - 요약/태그 업데이트 기능 테스트
// AI 메모장 프로젝트의 편집 관련 서버 액션 테스트
// 관련 파일: app/actions/notes.ts

import { updateNoteSummary, updateNoteTags } from '@/app/actions/notes';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

// Drizzle DB 모킹
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => [{}]),
        })),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve()),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve()),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve()),
    })),
  },
}));

// Next.js 캐시 모킹
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// 유효성 검사 모킹
jest.mock('@/lib/validations/notes', () => ({
  validateNoteId: jest.fn(() => ({ success: true, data: 'valid-id' })),
}));

describe('updateNoteSummary', () => {
  const mockSupabase = require('@/lib/supabase/server').createClient();
  const mockDb = require('@/lib/db').db;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 인증 성공 모킹
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    });
  });

  it('성공적으로 요약을 업데이트한다', async () => {
    const result = await updateNoteSummary('note-id', 'Updated summary content');

    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary.content).toBe('Updated summary content');
  });

  it('인증 실패 시 에러를 반환한다', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth failed'),
    });

    const result = await updateNoteSummary('note-id', 'Updated summary content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('유효하지 않은 노트 ID 시 에러를 반환한다', async () => {
    const mockValidateNoteId = require('@/lib/validations/notes').validateNoteId;
    mockValidateNoteId.mockReturnValue({ 
      success: false, 
      error: { issues: [{ message: '유효하지 않은 노트 ID입니다' }] }
    });

    const result = await updateNoteSummary('invalid-id', 'Updated summary content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('유효하지 않은 노트 ID입니다');
  });

  it('빈 요약 내용 시 에러를 반환한다', async () => {
    const result = await updateNoteSummary('note-id', '');

    expect(result.success).toBe(false);
    expect(result.error).toBe('요약 내용을 입력해주세요');
  });

  it('노트를 찾을 수 없을 때 에러를 반환한다', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => []), // 빈 배열 반환
        })),
      })),
    });

    const result = await updateNoteSummary('note-id', 'Updated summary content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 찾을 수 없습니다');
  });

  it('기존 요약이 있을 때 업데이트한다', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => [{ id: 'summary-id' }]), // 기존 요약 존재
        })),
      })),
    });

    const result = await updateNoteSummary('note-id', 'Updated summary content');

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('기존 요약이 없을 때 새로 생성한다', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => []), // 기존 요약 없음
        })),
      })),
    });

    const result = await updateNoteSummary('note-id', 'Updated summary content');

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });
});

describe('updateNoteTags', () => {
  const mockSupabase = require('@/lib/supabase/server').createClient();
  const mockDb = require('@/lib/db').db;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 인증 성공 모킹
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    });
  });

  it('성공적으로 태그를 업데이트한다', async () => {
    const result = await updateNoteTags('note-id', ['tag1', 'tag2', 'tag3']);

    expect(result.success).toBe(true);
    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('인증 실패 시 에러를 반환한다', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth failed'),
    });

    const result = await updateNoteTags('note-id', ['tag1', 'tag2']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('유효하지 않은 노트 ID 시 에러를 반환한다', async () => {
    const mockValidateNoteId = require('@/lib/validations/notes').validateNoteId;
    mockValidateNoteId.mockReturnValue({ 
      success: false, 
      error: { issues: [{ message: '유효하지 않은 노트 ID입니다' }] }
    });

    const result = await updateNoteTags('invalid-id', ['tag1', 'tag2']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('유효하지 않은 노트 ID입니다');
  });

  it('태그가 배열이 아닐 때 에러를 반환한다', async () => {
    const result = await updateNoteTags('note-id', 'not-an-array' as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('태그는 배열 형태여야 합니다');
  });

  it('태그 개수가 6개를 초과할 때 에러를 반환한다', async () => {
    const result = await updateNoteTags('note-id', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('태그는 최대 6개까지 입력할 수 있습니다');
  });

  it('노트를 찾을 수 없을 때 에러를 반환한다', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => []), // 빈 배열 반환
        })),
      })),
    });

    const result = await updateNoteTags('note-id', ['tag1', 'tag2']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 찾을 수 없습니다');
  });

  it('빈 태그 배열을 처리한다', async () => {
    const result = await updateNoteTags('note-id', []);

    expect(result.success).toBe(true);
    expect(result.tags).toEqual([]);
    expect(mockDb.delete).toHaveBeenCalled(); // 기존 태그 삭제
    expect(mockDb.insert).not.toHaveBeenCalled(); // 새 태그 추가 안함
  });

  it('빈 문자열 태그를 필터링한다', async () => {
    const result = await updateNoteTags('note-id', ['tag1', '', 'tag2', '   ', 'tag3']);

    expect(result.success).toBe(true);
    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('기존 태그를 삭제하고 새 태그를 추가한다', async () => {
    const result = await updateNoteTags('note-id', ['new-tag1', 'new-tag2']);

    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled(); // 기존 태그 삭제
    expect(mockDb.insert).toHaveBeenCalled(); // 새 태그 추가
  });
});
