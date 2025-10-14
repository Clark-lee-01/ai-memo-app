// __tests__/components/notes/summary-section.test.tsx
// SummarySection 컴포넌트 테스트
// 요약 생성, 표시, 재생성 기능 검증
// 관련 파일: components/notes/summary-section.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummarySection } from '../../../components/notes/summary-section';

// Mock 서버 액션
jest.mock('../../../app/actions/notes', () => ({
  generateNoteSummary: jest.fn(),
}));

import { generateNoteSummary } from '../../../app/actions/notes';
const mockGenerateNoteSummary = generateNoteSummary as jest.MockedFunction<typeof generateNoteSummary>;

describe('SummarySection', () => {
  const mockNoteId = '550e8400-e29b-41d4-a716-446655440001';
  const mockSummary = {
    content: '• 핵심 내용 1\n• 핵심 내용 2\n• 핵심 내용 3',
    createdAt: new Date('2024-12-19T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no summary exists', () => {
    render(<SummarySection noteId={mockNoteId} initialSummary={null} />);

    expect(screen.getByText('AI가 노트의 핵심 내용을 요약해드립니다')).toBeInTheDocument();
    expect(screen.getByText('요약 생성하기')).toBeInTheDocument();
  });

  it('should render existing summary when provided', () => {
    render(<SummarySection noteId={mockNoteId} initialSummary={mockSummary} />);

    expect(screen.getByText('핵심 내용 1')).toBeInTheDocument();
    expect(screen.getByText('핵심 내용 2')).toBeInTheDocument();
    expect(screen.getByText('핵심 내용 3')).toBeInTheDocument();
    expect(screen.getByText('재생성')).toBeInTheDocument();
  });

  it('should generate summary successfully', async () => {
    const user = userEvent.setup();
    
    // Promise를 지연시켜 로딩 상태를 확인할 수 있도록 함
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockGenerateNoteSummary.mockReturnValueOnce(promise);

    render(<SummarySection noteId={mockNoteId} initialSummary={null} />);

    const generateButton = screen.getByText('요약 생성하기');
    await user.click(generateButton);

    // 로딩 상태 확인
    expect(screen.getByText('요약 생성 중...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /요약 생성 중/ })).toBeDisabled();

    // Promise 해결
    resolvePromise!({
      success: true,
      summary: '• 새로운 요약 1\n• 새로운 요약 2',
      message: '요약이 생성되었습니다',
    });

    await waitFor(() => {
      expect(screen.getByText('새로운 요약 1')).toBeInTheDocument();
      expect(screen.getByText('새로운 요약 2')).toBeInTheDocument();
    });

    expect(mockGenerateNoteSummary).toHaveBeenCalledWith(mockNoteId, false);
  });

  it('should handle existing summary with overwrite confirmation', async () => {
    const user = userEvent.setup();
    
    // 첫 번째 호출: 기존 요약이 있다는 응답
    mockGenerateNoteSummary.mockResolvedValueOnce({
      success: false,
      error: '이미 요약이 존재합니다.',
      hasExistingSummary: true,
    });

    // 두 번째 호출: 덮어쓰기 성공
    mockGenerateNoteSummary.mockResolvedValueOnce({
      success: true,
      summary: '• 덮어쓴 요약 1\n• 덮어쓴 요약 2',
      message: '요약이 업데이트되었습니다',
    });

    // window.confirm 모킹
    window.confirm = jest.fn(() => true);

    render(<SummarySection noteId={mockNoteId} initialSummary={null} />);

    const generateButton = screen.getByText('요약 생성하기');
    await user.click(generateButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('이미 요약이 존재합니다. 덮어쓰시겠습니까?');
    });

    await waitFor(() => {
      expect(screen.getByText('덮어쓴 요약 1')).toBeInTheDocument();
      expect(screen.getByText('덮어쓴 요약 2')).toBeInTheDocument();
    });

    expect(mockGenerateNoteSummary).toHaveBeenCalledTimes(2);
    expect(mockGenerateNoteSummary).toHaveBeenNthCalledWith(1, mockNoteId, false);
    expect(mockGenerateNoteSummary).toHaveBeenNthCalledWith(2, mockNoteId, true);
  });

  it('should display error message when generation fails', async () => {
    const user = userEvent.setup();
    
    mockGenerateNoteSummary.mockResolvedValueOnce({
      success: false,
      error: 'API 오류가 발생했습니다.',
    });

    render(<SummarySection noteId={mockNoteId} initialSummary={null} />);

    const generateButton = screen.getByText('요약 생성하기');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('API 오류가 발생했습니다.')).toBeInTheDocument();
    });
  });

  it('should format summary content correctly', () => {
    const summaryWithBullets = {
      content: '• 첫 번째 포인트\n• 두 번째 포인트\n• 세 번째 포인트',
      createdAt: new Date('2024-12-19T10:00:00Z'),
    };

    render(<SummarySection noteId={mockNoteId} initialSummary={summaryWithBullets} />);

    expect(screen.getByText('첫 번째 포인트')).toBeInTheDocument();
    expect(screen.getByText('두 번째 포인트')).toBeInTheDocument();
    expect(screen.getByText('세 번째 포인트')).toBeInTheDocument();
  });
});