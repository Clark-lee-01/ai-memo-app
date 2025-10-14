// __tests__/components/notes/tags-section.test.tsx
// TagsSection 컴포넌트 테스트 - 태그 표시, 생성, 재생성 기능 검증
// AI 메모장 프로젝트의 태그 관리 UI 컴포넌트 테스트
// 관련 파일: components/notes/tags-section.tsx, app/actions/notes.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsSection from '@/components/notes/tags-section';

// 서버 액션 모킹
jest.mock('@/app/actions/notes', () => ({
  generateNoteTags: jest.fn(),
  getNoteTags: jest.fn(),
}));

const mockGenerateNoteTags = require('@/app/actions/notes').generateNoteTags;
const mockGetNoteTags = require('@/app/actions/notes').getNoteTags;

describe('TagsSection', () => {
  const mockNoteId = 'test-note-id';
  const mockTags = ['태그1', '태그2', '태그3'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('초기 렌더링', () => {
    it('태그가 없을 때 기본 상태를 올바르게 표시한다', () => {
      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      expect(screen.getByText('태그')).toBeInTheDocument();
      expect(screen.getByText('아직 생성된 태그가 없습니다.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /AI 태그 생성/ })).toBeInTheDocument();
    });

    it('초기 태그가 있을 때 태그들을 올바르게 표시한다', () => {
      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);
      
      expect(screen.getByText('태그')).toBeInTheDocument();
      mockTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /재생성/ })).toBeInTheDocument();
      expect(screen.queryByText('아직 생성된 태그가 없습니다.')).not.toBeInTheDocument();
    });
  });

  describe('태그 생성', () => {
    it('태그 생성 버튼을 클릭하면 태그를 생성한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: true,
        tags: mockTags,
        message: '태그가 생성되었습니다'
      });

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      expect(mockGenerateNoteTags).toHaveBeenCalledWith(mockNoteId, false);
      
      await waitFor(() => {
        mockTags.forEach(tag => {
          expect(screen.getByText(tag)).toBeInTheDocument();
        });
      });
    });

    it('태그 생성 중 로딩 상태를 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          tags: mockTags,
          message: '태그가 생성되었습니다'
        }), 100))
      );

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      expect(screen.getByText('태그 생성 중...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /태그 생성 중/ })).toBeDisabled();
    });

    it('태그 생성 실패 시 에러 메시지를 표시한다', async () => {
      const user = userEvent.setup();
      const errorMessage = '태그 생성 중 오류가 발생했습니다.';
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('기존 태그 덮어쓰기', () => {
    it('기존 태그가 있을 때 덮어쓰기 확인 다이얼로그를 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        error: '이미 태그가 존재합니다.',
        hasExistingTags: true
      });

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /덮어쓰기/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
      });
    });

    it('덮어쓰기 확인을 클릭하면 태그를 덮어쓴다', async () => {
      const user = userEvent.setup();
      const newTags = ['새태그1', '새태그2'];
      
      mockGenerateNoteTags
        .mockResolvedValueOnce({
          success: false,
          error: '이미 태그가 존재합니다.',
          hasExistingTags: true
        })
        .mockResolvedValueOnce({
          success: true,
          tags: newTags,
          message: '태그가 업데이트되었습니다'
        });

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).toBeInTheDocument();
      });

      const overwriteButton = screen.getByRole('button', { name: /덮어쓰기/ });
      await user.click(overwriteButton);

      expect(mockGenerateNoteTags).toHaveBeenCalledWith(mockNoteId, true);
      
      await waitFor(() => {
        newTags.forEach(tag => {
          expect(screen.getByText(tag)).toBeInTheDocument();
        });
      });
    });

    it('덮어쓰기 취소를 클릭하면 다이얼로그가 닫힌다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        error: '이미 태그가 존재합니다.',
        hasExistingTags: true
      });

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /취소/ });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).not.toBeInTheDocument();
      });
    });
  });

  describe('태그 재생성', () => {
    it('재생성 버튼을 클릭하면 덮어쓰기 확인 다이얼로그를 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        error: '이미 태그가 존재합니다.',
        hasExistingTags: true
      });

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);
      
      const regenerateButton = screen.getByRole('button', { name: /재생성/ });
      await user.click(regenerateButton);

      await waitFor(() => {
        expect(screen.getByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).toBeInTheDocument();
      });
    });
  });

  describe('에러 처리', () => {
    it('API 호출 중 예외가 발생하면 에러 메시지를 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockRejectedValue(new Error('Network error'));

      render(<TagsSection noteId={mockNoteId} initialTags={[]} />);
      
      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('태그 생성 중 오류가 발생했습니다.')).toBeInTheDocument();
      });
    });
  });
});
