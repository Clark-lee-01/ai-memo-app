// __tests__/actions/notes.test.ts
// 노트 Server Actions 테스트 - 노트 CRUD 액션 테스트
// AI 메모장 프로젝트의 노트 액션 테스트

import { createNote, getNote, getNotes, updateNote, deleteNote, generateNoteTags, getNoteTags } from '@/app/actions/notes';
import { db } from '@/lib/db';
import { notes, noteTags } from '@/lib/drizzle/schema';

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

// Gemini API 모킹
jest.mock('@/lib/ai/gemini', () => ({
  generateTags: jest.fn(),
  GeminiAPIError: class GeminiAPIError extends Error {
    constructor(message: string, code?: string, statusCode?: number) {
      super(message);
      this.name = 'GeminiAPIError';
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

const mockDb = db as any;

describe('Notes Actions', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
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
      const mockNote = { id: '550e8400-e29b-41d4-a716-446655440001' };
      
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
      expect(result.noteId).toBe('550e8400-e29b-41d4-a716-446655440001');
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
        id: '550e8400-e29b-41d4-a716-446655440001',
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

      const result = await getNote('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toEqual(mockNote);
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getNote('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow('로그인이 필요합니다');
    });

    it('should throw error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(getNote('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow('노트를 찾을 수 없습니다');
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
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Updated Title',
        content: 'Updated Content',
        userId: 'test-user-id',
      };

      // 기존 노트 조회 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440001', userId: 'test-user-id' }]),
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

      const result = await updateNote('550e8400-e29b-41d4-a716-446655440001', formData);

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

      await expect(updateNote('550e8400-e29b-41d4-a716-446655440001', formData)).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });

  describe('deleteNote', () => {
    it('should delete note successfully', async () => {
      // 기존 노트 조회 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440001', userId: 'test-user-id' }]),
          }),
        }),
      });

      // 삭제 모킹
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await deleteNote('550e8400-e29b-41d4-a716-446655440001');

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

      await expect(deleteNote('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });

  describe('generateNoteTags', () => {
    const { generateTags } = require('@/lib/ai/gemini');
    const mockNoteId = '550e8400-e29b-41d4-a716-446655440001';
    const mockTags = ['태그1', '태그2', '태그3'];

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should generate tags successfully', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: 'Test content for tag generation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      generateTags.mockResolvedValue(mockTags);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      });

      const result = await generateNoteTags(mockNoteId);

      expect(result.success).toBe(true);
      expect(result.tags).toEqual(mockTags);
      expect(generateTags).toHaveBeenCalledWith(mockNote.content);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await generateNoteTags(mockNoteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });

    it('should return error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await generateNoteTags(mockNoteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트를 찾을 수 없습니다');
    });

    it('should return error when note content is empty', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      const result = await generateNoteTags(mockNoteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('태그를 생성할 내용이 없습니다. 노트에 본문을 작성해주세요.');
    });

    it('should return error when tags already exist and overwrite is false', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ tag: 'existing-tag' }]),
        }),
      });

      const result = await generateNoteTags(mockNoteId, false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('이미 태그가 존재합니다. 덮어쓰기를 원하시면 확인해주세요.');
      expect(result.hasExistingTags).toBe(true);
    });

    it('should overwrite existing tags when overwrite is true', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ tag: 'existing-tag' }]),
        }),
      });

      generateTags.mockResolvedValue(mockTags);

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      });

      const result = await generateNoteTags(mockNoteId, true);

      expect(result.success).toBe(true);
      expect(result.tags).toEqual(mockTags);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle Gemini API error', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const { GeminiAPIError } = require('@/lib/ai/gemini');
      generateTags.mockRejectedValue(new GeminiAPIError('API Error', 'API_ERROR'));

      const result = await generateNoteTags(mockNoteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI 태그 생성 중 오류가 발생했습니다: API Error');
    });
  });

  describe('getNoteTags', () => {
    const mockNoteId = '550e8400-e29b-41d4-a716-446655440001';
    const mockTags = ['태그1', '태그2', '태그3'];

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return tags successfully', async () => {
      const mockNote = {
        id: mockNoteId,
        userId: mockUser.id,
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockTags.map(tag => ({ tag }))),
        }),
      });

      const result = await getNoteTags(mockNoteId);

      expect(result).toEqual(mockTags);
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getNoteTags(mockNoteId)).rejects.toThrow('로그인이 필요합니다');
    });

    it('should throw error when note is not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(getNoteTags(mockNoteId)).rejects.toThrow('노트를 찾을 수 없습니다');
    });
  });
});
