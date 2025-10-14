// __tests__/actions/trash.test.ts
// 휴지통 Server Actions 테스트
// AI 메모장 프로젝트의 휴지통 기능 테스트

import { getTrashNotes, restoreNote, permanentlyDeleteNote, emptyTrash, cleanupExpiredNotes } from '@/app/actions/trash';

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
};

const mockNotes = [
  {
    id: 'note-1',
    title: 'Test Note 1',
    content: 'Test content 1',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: new Date('2024-01-15'),
    deletedBy: 'user-1',
  },
  {
    id: 'note-2',
    title: 'Test Note 2',
    content: 'Test content 2',
    userId: 'user-1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: new Date('2024-01-16'),
    deletedBy: 'user-1',
  },
];

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/db', () => ({
  db: mockDb,
}));

jest.mock('@/drizzle/schema', () => ({
  notes: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    content: 'content',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    deletedBy: 'deletedBy',
  },
}));

jest.mock('@/lib/validations/notes', () => ({
  validateNoteId: jest.fn(() => ({ success: true, data: 'valid-id' })),
}));

describe('Trash Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });
  });

  describe('getTrashNotes', () => {
    it('삭제된 노트 목록을 조회한다', async () => {
      mockDb.select.mockResolvedValueOnce(mockNotes);
      mockDb.select.mockResolvedValueOnce([{ count: 2 }]);

      const result = await getTrashNotes({ page: 1, limit: 20 });

      expect(result.notes).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
    });

    it('인증되지 않은 사용자에게 에러를 던진다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getTrashNotes()).rejects.toThrow('로그인이 필요합니다');
    });
  });

  describe('restoreNote', () => {
    it('노트를 복구한다', async () => {
      mockDb.select.mockResolvedValueOnce([mockNotes[0]]);
      mockDb.update.mockResolvedValueOnce([]);

      await restoreNote('note-1');

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({
        deletedAt: null,
        deletedBy: null,
        updatedAt: expect.any(Date),
      });
    });

    it('존재하지 않는 노트에 대해 에러를 던진다', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      await expect(restoreNote('non-existent')).rejects.toThrow('휴지통에서 노트를 찾을 수 없습니다');
    });
  });

  describe('permanentlyDeleteNote', () => {
    it('노트를 영구 삭제한다', async () => {
      mockDb.select.mockResolvedValueOnce([mockNotes[0]]);
      mockDb.delete.mockResolvedValueOnce([]);

      await permanentlyDeleteNote('note-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('존재하지 않는 노트에 대해 에러를 던진다', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      await expect(permanentlyDeleteNote('non-existent')).rejects.toThrow('휴지통에서 노트를 찾을 수 없습니다');
    });
  });

  describe('emptyTrash', () => {
    it('휴지통을 비운다', async () => {
      mockDb.delete.mockResolvedValueOnce([{ id: 'note-1' }, { id: 'note-2' }]);

      const result = await emptyTrash();

      expect(result.deletedCount).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredNotes', () => {
    it('30일 경과된 노트를 정리한다', async () => {
      const expiredNotes = [
        { id: 'expired-1', userId: 'user-1' },
        { id: 'expired-2', userId: 'user-1' },
      ];
      
      mockDb.select.mockResolvedValueOnce(expiredNotes);
      mockDb.delete.mockResolvedValueOnce(expiredNotes);

      const result = await cleanupExpiredNotes();

      expect(result.deletedCount).toBe(2);
      expect(result.deletedNotes).toEqual(expiredNotes);
    });

    it('정리할 노트가 없을 때 빈 결과를 반환한다', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      const result = await cleanupExpiredNotes();

      expect(result.deletedCount).toBe(0);
    });
  });
});
