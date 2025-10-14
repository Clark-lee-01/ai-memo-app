// __tests__/actions/notes.test.ts
// 노트 Server Actions 테스트 - 노트 CRUD 액션 테스트
// AI 메모장 프로젝트의 노트 액션 테스트

import { createNote, getNote, getNotes, updateNote, deleteNote } from '@/app/actions/notes';
import { db } from '@/lib/db';
import { notes } from '@/lib/drizzle/schema';

// Supabase 클라이언트 모킹
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
  createServerClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Drizzle DB 모킹
jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Next.js 함수 모킹
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockDb = db as any;

describe('Notes Actions', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 인증 모킹
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('createNote', () => {
    it('should create note successfully', async () => {
      const mockNote = { id: 'test-note-id' };
      
      // 사용자 조회 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'test-user-id' }]),
          }),
        }),
      });
      
      // 노트 삽입 모킹
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockNote]),
        }),
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('content', 'Test Content');

      const result = await createNote(formData);

      expect(result.success).toBe(true);
      expect(result.noteId).toBe('test-note-id');
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');

      const result = await createNote(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });

    it('should return error when validation fails', async () => {
      const formData = new FormData();
      formData.append('title', ''); // 빈 제목

      const result = await createNote(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('제목을 입력해주세요');
    });

    it('should handle database error', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');

      const result = await createNote(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    });
  });

  describe('getNote', () => {
    it('should get note successfully', async () => {
      const mockNote = {
        id: 'test-note-id',
        title: 'Test Title',
        content: 'Test Content',
        userId: 'test-user-id',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      const result = await getNote('test-note-id');

      expect(result).toEqual(mockNote);
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getNote('test-note-id')).rejects.toThrow('로그인이 필요합니다');
    });

    it('should throw error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(getNote('test-note-id')).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });

  describe('getNotes', () => {
    it('should get notes list successfully', async () => {
      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1' },
        { id: '2', title: 'Note 2', content: 'Content 2' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockNotes),
              }),
            }),
          }),
        }),
      });

      // count 쿼리 모킹
      const mockCountQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }]),
        }),
      };
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      const result = await getNotes({ page: 1, limit: 10 });

      expect(result.notes).toEqual(mockNotes);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getNotes()).rejects.toThrow('로그인이 필요합니다');
    });
  });

  describe('updateNote', () => {
    it('should update note successfully', async () => {
      const mockUpdatedNote = {
        id: 'test-note-id',
        title: 'Updated Title',
        content: 'Updated Content',
        userId: 'test-user-id',
      };

      // 기존 노트 조회 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'test-note-id', userId: 'test-user-id' }]),
          }),
        }),
      });

      // 업데이트 모킹
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedNote]),
          }),
        }),
      });

      const formData = new FormData();
      formData.append('title', 'Updated Title');
      formData.append('content', 'Updated Content');

      const result = await updateNote('test-note-id', formData);

      expect(result).toEqual(mockUpdatedNote);
    });

    it('should throw error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const formData = new FormData();
      formData.append('title', 'Updated Title');

      await expect(updateNote('test-note-id', formData)).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });

  describe('deleteNote', () => {
    it('should delete note successfully', async () => {
      // 기존 노트 조회 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'test-note-id', userId: 'test-user-id' }]),
          }),
        }),
      });

      // 삭제 모킹
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await deleteNote('test-note-id');

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(deleteNote('test-note-id')).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });
});
