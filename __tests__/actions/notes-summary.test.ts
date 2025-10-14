// __tests__/actions/notes-summary.test.ts
// 노트 요약 관련 서버 액션 테스트
// generateNoteSummary, getNoteSummary 함수 검증
// 관련 파일: app/actions/notes.ts, lib/ai/gemini.ts

import { generateNoteSummary, getNoteSummary } from '../../app/actions/notes';
import { generateSummary } from '../../lib/ai/gemini';
import { db } from '../../lib/db';

// 모킹 설정
jest.mock('../../lib/ai/gemini');
jest.mock('../../lib/supabase/server');
jest.mock('../../lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  },
}));

const mockGenerateSummary = generateSummary as jest.MockedFunction<typeof generateSummary>;
const mockDb = db as jest.Mocked<typeof db>;

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('../../lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock Next.js
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Notes Summary Actions', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
  };

  const mockNote = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Note',
    content: 'This is a test note content for AI summarization.',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };

  const mockSummary = {
    noteId: '550e8400-e29b-41d4-a716-446655440001',
    model: 'gemini-2.5-flash',
    content: '• Test summary point 1\n• Test summary point 2\n• Test summary point 3',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 인증 설정
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('generateNoteSummary', () => {
    it('should generate summary successfully for new note', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([]); // 기존 요약 없음
      (mockDb.insert as jest.Mock).mockResolvedValueOnce([mockSummary]); // 요약 저장
      
      // Mock Gemini API
      mockGenerateSummary.mockResolvedValueOnce('• Test summary point 1\n• Test summary point 2\n• Test summary point 3');

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result.success).toBe(true);
      expect(result.summary).toBe('• Test summary point 1\n• Test summary point 2\n• Test summary point 3');
      expect(result.message).toBe('요약이 생성되었습니다');
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockNote.content);
    });

    it('should update existing summary when overwrite is true', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockSummary]); // 기존 요약 있음
      (mockDb.update as jest.Mock).mockResolvedValueOnce([mockSummary]); // 요약 업데이트
      
      // Mock Gemini API
      mockGenerateSummary.mockResolvedValueOnce('• Updated summary point 1\n• Updated summary point 2');

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001', true);

      expect(result.success).toBe(true);
      expect(result.summary).toBe('• Updated summary point 1\n• Updated summary point 2');
      expect(result.message).toBe('요약이 업데이트되었습니다');
    });

    it('should return error when existing summary exists and overwrite is false', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockSummary]); // 기존 요약 있음

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001', false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('이미 요약이 존재합니다. 덮어쓰기를 원하시면 확인해주세요.');
      expect(result.hasExistingSummary).toBe(true);
    });

    it('should return error when note has no content', async () => {
      const noteWithoutContent = { ...mockNote, content: '' };
      
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([noteWithoutContent]); // 노트 조회

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 내용이 없습니다. 노트에 본문을 작성해주세요.');
    });

    it('should return error when note is not found', async () => {
      // Mock 데이터베이스 응답 - 노트 없음
      (mockDb.select as jest.Mock).mockResolvedValueOnce([]);

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트를 찾을 수 없습니다');
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });

    it('should handle Gemini API errors', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([]); // 기존 요약 없음
      
      // Mock Gemini API 에러
      mockGenerateSummary.mockRejectedValueOnce(new Error('API Error'));

      const result = await generateNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    });

    it('should handle invalid note ID', async () => {
      const result = await generateNoteSummary('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('유효하지 않은 노트 ID입니다');
    });
  });

  describe('getNoteSummary', () => {
    it('should return summary when it exists', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockSummary]); // 요약 조회

      const result = await getNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toEqual(mockSummary);
    });

    it('should return null when summary does not exist', async () => {
      // Mock 데이터베이스 응답
      (mockDb.select as jest.Mock).mockResolvedValueOnce([mockNote]); // 노트 조회
      (mockDb.select as jest.Mock).mockResolvedValueOnce([]); // 요약 없음

      const result = await getNoteSummary('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toBeNull();
    });

    it('should throw error when note is not found', async () => {
      // Mock 데이터베이스 응답 - 노트 없음
      (mockDb.select as jest.Mock).mockResolvedValueOnce([]);

      await expect(getNoteSummary('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow('노트를 찾을 수 없습니다');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getNoteSummary('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow('로그인이 필요합니다');
    });

    it('should throw error for invalid note ID', async () => {
      await expect(getNoteSummary('invalid-id')).rejects.toThrow('유효하지 않은 노트 ID입니다');
    });
  });
});
