// __tests__/components/notes/summary-section-improved.test.tsx
// 개선된 SummarySection 컴포넌트 테스트 - AI 상태 표시 기능 검증
// AI 메모장 프로젝트의 개선된 요약 섹션 컴포넌트 테스트
// 관련 파일: components/notes/summary-section.tsx, lib/hooks/useAIStatus.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummarySection } from '@/components/notes/summary-section';

// 서버 액션 모킹
jest.mock('@/app/actions/notes', () => ({
  generateNoteSummary: jest.fn(),
}));

// useAIStatus 훅 모킹
jest.mock('@/lib/hooks/useAIStatus', () => ({
  useAIStatus: jest.fn(),
}));

const mockGenerateNoteSummary = require('@/app/actions/notes').generateNoteSummary;
const mockUseAIStatus = require('@/lib/hooks/useAIStatus').useAIStatus;

describe('SummarySection (Improved)', () => {
  const mockNoteId = 'test-note-id';
  const mockSummary = {
    content: '• 요약 포인트 1\n• 요약 포인트 2\n• 요약 포인트 3',
    createdAt: new Date('2024-01-01'),
  };

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

      render(<SummarySection noteId={mockNoteId} />);

      expect(screen.getByText('AI가 요약을 생성하고 있습니다...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /요약 생성 중/ })).toBeDisabled();
    });

    it('성공 상태를 올바르게 표시한다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isSuccess: true,
        isProcessing: true,
        processingTime: 3,
      });

      render(<SummarySection noteId={mockNoteId} initialSummary={mockSummary} />);

      expect(screen.getByText('요약이 성공적으로 생성되었습니다')).toBeInTheDocument();
      expect(screen.getByText('3초')).toBeInTheDocument();
    });

    it('에러 상태를 올바르게 표시한다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isError: true,
        isProcessing: false,
        getErrorMessage: () => '네트워크 오류가 발생했습니다',
        canRetry: () => true,
      });

      render(<SummarySection noteId={mockNoteId} />);

      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument();
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

      render(<SummarySection noteId={mockNoteId} />);

      expect(screen.getByText('토큰 제한 초과')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /재시도/ })).not.toBeInTheDocument();
    });
  });

  describe('AI 상태 관리', () => {
    it('요약 생성 시 AI 상태를 올바르게 관리한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteSummary.mockResolvedValue({
        success: true,
        summary: 'Test summary',
      });

      render(<SummarySection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /요약 생성하기/ });
      await user.click(generateButton);

      expect(mockAIStatus.reset).toHaveBeenCalled();
      expect(mockAIStatus.startProcessing).toHaveBeenCalled();
    });

    it('요약 생성 성공 시 성공 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteSummary.mockResolvedValue({
        success: true,
        summary: 'Test summary',
      });

      render(<SummarySection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /요약 생성하기/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markSuccess).toHaveBeenCalled();
      });
    });

    it('요약 생성 실패 시 에러 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteSummary.mockResolvedValue({
        success: false,
        error: 'API 오류',
      });

      render(<SummarySection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /요약 생성하기/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markError).toHaveBeenCalled();
      });
    });

    it('예외 발생 시 에러 상태로 표시한다', async () => {
      const user = userEvent.setup();
      mockGenerateNoteSummary.mockRejectedValue(new Error('Network error'));

      render(<SummarySection noteId={mockNoteId} />);

      const generateButton = screen.getByRole('button', { name: /요약 생성하기/ });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIStatus.markError).toHaveBeenCalled();
      });
    });
  });

  describe('버튼 비활성화', () => {
    it('AI 처리 중에는 버튼이 비활성화된다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isProcessing: true,
      });

      render(<SummarySection noteId={mockNoteId} />);

      expect(screen.getByRole('button', { name: /요약 생성하기/ })).toBeDisabled();
    });

    it('기존 요약이 있을 때 재생성 버튼이 비활성화된다', () => {
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isProcessing: true,
      });

      render(<SummarySection noteId={mockNoteId} initialSummary={mockSummary} />);

      expect(screen.getByRole('button', { name: /재생성/ })).toBeDisabled();
    });
  });

  describe('재시도 기능', () => {
    it('재시도 버튼을 클릭하면 요약 생성을 다시 시도한다', async () => {
      const user = userEvent.setup();
      mockUseAIStatus.mockReturnValue({
        ...mockAIStatus,
        isError: true,
        isProcessing: false,
        getErrorMessage: () => '네트워크 오류',
        canRetry: () => true,
      });

      render(<SummarySection noteId={mockNoteId} />);

      const retryButton = screen.getByRole('button', { name: /재시도/ });
      await user.click(retryButton);

      expect(mockAIStatus.reset).toHaveBeenCalled();
      expect(mockAIStatus.startProcessing).toHaveBeenCalled();
    });
  });

  describe('기존 기능 유지', () => {
    it('기존 요약 표시 기능이 정상 작동한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<SummarySection noteId={mockNoteId} initialSummary={mockSummary} />);

      expect(screen.getByText('요약 포인트 1')).toBeInTheDocument();
      expect(screen.getByText('요약 포인트 2')).toBeInTheDocument();
      expect(screen.getByText('요약 포인트 3')).toBeInTheDocument();
    });

    it('요약이 없을 때 생성 버튼을 표시한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<SummarySection noteId={mockNoteId} />);

      expect(screen.getByRole('button', { name: /요약 생성하기/ })).toBeInTheDocument();
    });

    it('기존 요약이 있을 때 재생성 버튼을 표시한다', () => {
      mockUseAIStatus.mockReturnValue(mockAIStatus);

      render(<SummarySection noteId={mockNoteId} initialSummary={mockSummary} />);

      expect(screen.getByRole('button', { name: /재생성/ })).toBeInTheDocument();
    });
  });
});
