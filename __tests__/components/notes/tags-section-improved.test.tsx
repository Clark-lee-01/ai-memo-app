// __tests__/components/notes/tags-section-improved.test.tsx
// 개선된 TagsSection 컴포넌트 테스트 - AI 상태 표시 기능 검증
// AI 메모장 프로젝트의 개선된 태그 섹션 컴포넌트 테스트
// 관련 파일: components/notes/tags-section.tsx, lib/hooks/useAIStatus.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsSection from '@/components/notes/tags-section';

// 서버 액션 모킹
jest.mock('@/app/actions/notes', () => ({
  generateNoteTags: jest.fn(),
  getNoteTags: jest.fn(),
}));

// useAIStatus 훅 모킹
jest.mock('@/lib/hooks/useAIStatus', () => ({
  useAIStatus: jest.fn(),
}));

const mockGenerateNoteTags = require('@/app/actions/notes').generateNoteTags;
const mockUseAIStatus = require('@/lib/hooks/useAIStatus').useAIStatus;

describe('TagsSection (Improved)', () => {
  const mockNoteId = 'test-note-id';
  const mockTags = ['태그1', '태그2', '태그3'];

  const mockAIStatus = {
    status: 'idle',
    error: null,
    errorType: null,
    processingTime: null,
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isProcessing: false,
    startProcessing: jest.fn(),
    markSuccess: jest.fn(),
    markError: jest.fn(),
    reset: jest.fn(),
    getErrorMessage: jest.fn(),
    getErrorType: jest.fn(),
    canRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAIStatus.mockReturnValue(mockAIStatus);
  });

  describe('AI 상태 표시', () => {
    it('로딩 상태를 올바르게 표시한다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isLoading: true,
        isProcessing: true,
      });

      render(<TagsSection noteId={mockNoteId} />);

      expect(screen.getByText('AI가 태그를 생성하고 있습니다...')).toBeInTheDocument();
    });

    it('성공 상태를 올바르게 표시한다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isSuccess: true,
        isProcessing: true,
        processingTime: 2,
      });

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      expect(screen.getByText('태그가 성공적으로 생성되었습니다')).toBeInTheDocument();
      expect(screen.getByText('2초')).toBeInTheDocument();
    });

    it('에러 상태를 올바르게 표시한다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isError: true,
        isProcessing: false,
        getErrorMessage: () => 'API 오류가 발생했습니다',
        canRetry: () => true,
      });

      render(<TagsSection noteId={mockNoteId} />);

      expect(screen.getByText('API 오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /재시도/ })).toBeInTheDocument();
    });

    it('재시도 불가능한 에러는 재시도 버튼을 표시하지 않는다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isError: true,
        isProcessing: false,
        getErrorMessage: () => '토큰 제한 초과',
        canRetry: () => false,
      });

      render(<TagsSection noteId={mockNoteId} />);

      expect(screen.getByText('토큰 제한 초과')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /재시도/ })).not.toBeInTheDocument();
    });
  });

  describe('AI 상태 관리', () => {
    it('태그 생성 시 AI 상태를 올바르게 관리한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: true,
        tags: ['새로운 태그'],
      });

      render(<TagsSection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      expect(mockAIStatus.reset).toHaveBeenCalled();
      expect(mockAIStatus.startProcessing).toHaveBeenCalled();
    });

    it('태그 생성 성공 시 성공 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: true,
        tags: ['새로운 태그'],
      });

      render(<TagsSection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markSuccess).toHaveBeenCalled();
      });
    });

    it('태그 생성 실패 시 에러 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        error: 'API 오류',
      });

      render(<TagsSection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markError).toHaveBeenCalled();
      });
    });

    it('예외 발생 시 에러 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteTags.mockRejectedValue(new Error('Network error'));

      render(<TagsSection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /AI 태그 생성/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markError).toHaveBeenCalled();
      });
    });
  });

  describe('버튼 비활성화', () => {
    it('AI 처리 중에는 태그 생성 버튼이 비활성화된다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isProcessing: true,
      });

      render(<TagsSection noteId={mockNoteId} />);

      expect(screen.getByRole('button', { name: /AI 태그 생성/ })).toBeDisabled();
    });

    it('AI 처리 중에는 재생성 버튼이 비활성화된다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isProcessing: true,
      });

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      expect(screen.getByRole('button', { name: /재생성/ })).toBeDisabled();
    });

    it('AI 처리 중에는 모든 버튼이 비활성화된다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isProcessing: true,
      });

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      // 재생성 버튼이 비활성화되어야 함
      expect(screen.getByRole('button', { name: /재생성/ })).toBeDisabled();
    });
  });

  describe('재시도 기능', () => {
    it('재시도 버튼을 클릭하면 태그 생성을 다시 시도한다', async () => {
      const user = userEvent.setup();
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isError: true,
        isProcessing: false,
        getErrorMessage: () => '네트워크 오류',
        canRetry: () => true,
      });

      render(<TagsSection noteId={mockNoteId} />);

      const retryButton = screen.getByRole('button', { name: /재시도/ });
      await user.click(retryButton);

      expect(mockAIStatus.reset).toHaveBeenCalled();
      expect(mockAIStatus.startProcessing).toHaveBeenCalled();
    });
  });

  describe('기존 기능 유지', () => {
    it('기존 태그 표시 기능이 정상 작동한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      expect(screen.getByText('태그1')).toBeInTheDocument();
      expect(screen.getByText('태그2')).toBeInTheDocument();
      expect(screen.getByText('태그3')).toBeInTheDocument();
    });

    it('태그가 없을 때 생성 버튼을 표시한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<TagsSection noteId={mockNoteId} />);

      expect(screen.getByRole('button', { name: /AI 태그 생성/ })).toBeInTheDocument();
    });

    it('기존 태그가 있을 때 재생성 버튼을 표시한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      expect(screen.getByRole('button', { name: /재생성/ })).toBeInTheDocument();
    });

    it('덮어쓰기 다이얼로그가 정상 작동한다', async () => {
      const user = userEvent.setup();
      mockUseAIStatus.mockReturnValue(mockAIStatus);
      mockGenerateNoteTags.mockResolvedValue({
        success: false,
        hasExistingTags: true,
      });

      render(<TagsSection noteId={mockNoteId} initialTags={mockTags} />);

      const regenerateButton = screen.getByRole('button', { name: /재생성/ });
      await user.click(regenerateButton);

      expect(screen.getByText('이미 태그가 존재합니다. 기존 태그를 덮어쓰시겠습니까?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /덮어쓰기/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
    });
  });
});
