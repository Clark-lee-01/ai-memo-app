// __tests__/components/notes/note-detail-actions.test.tsx
// 노트 상세 액션 버튼 컴포넌트 테스트
// 수정 및 삭제 버튼의 동작 및 렌더링을 검증
// 관련 파일: components/notes/note-detail-actions.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteDetailActions } from '@/components/notes/note-detail-actions';

// Mock dependencies
const mockDeleteNote = jest.fn();
const mockPush = jest.fn();

jest.mock('@/app/actions/notes', () => ({
  deleteNote: (...args: any[]) => mockDeleteNote(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('NoteDetailActions', () => {
  const mockNoteId = 'test-note-id-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('수정 및 삭제 버튼을 렌더링한다', () => {
    render(<NoteDetailActions noteId={mockNoteId} />);

    expect(screen.getByRole('button', { name: /수정/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /삭제/i })).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 수정 페이지로 이동한다', async () => {
    const user = userEvent.setup();
    render(<NoteDetailActions noteId={mockNoteId} />);

    const editButton = screen.getByRole('button', { name: /수정/i });
    await user.click(editButton);

    expect(mockPush).toHaveBeenCalledWith(`/notes/${mockNoteId}/edit`);
  });

  it('삭제 버튼 클릭 시 확인 다이얼로그를 표시한다', async () => {
    const user = userEvent.setup();
    render(<NoteDetailActions noteId={mockNoteId} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    // AlertDialog가 열리는지 확인
    expect(screen.getByText(/정말로 이 노트를 삭제하시겠습니까?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();
  });

  it('삭제 확인 시 deleteNote 액션을 호출한다', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockResolvedValue(undefined);

    render(<NoteDetailActions noteId={mockNoteId} />);

    // 삭제 버튼 클릭
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    // 확인 다이얼로그에서 삭제 버튼 클릭
    const confirmButtons = screen.getAllByRole('button', { name: /삭제/i });
    const confirmButton = confirmButtons.find(btn => 
      btn.className.includes('bg-destructive')
    );
    
    if (confirmButton) {
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteNote).toHaveBeenCalledWith(mockNoteId);
      });
    }
  });

  it('삭제 취소 시 다이얼로그를 닫는다', async () => {
    const user = userEvent.setup();
    render(<NoteDetailActions noteId={mockNoteId} />);

    // 삭제 버튼 클릭
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    // 취소 버튼 클릭
    const cancelButton = screen.getByRole('button', { name: /취소/i });
    await user.click(cancelButton);

    // 다이얼로그가 닫혔는지 확인
    await waitFor(() => {
      expect(screen.queryByText(/정말로 이 노트를 삭제하시겠습니까?/i)).not.toBeInTheDocument();
    });

    expect(mockDeleteNote).not.toHaveBeenCalled();
  });

  it('삭제 에러 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    const errorMessage = '노트 삭제 실패';
    mockDeleteNote.mockRejectedValue(new Error(errorMessage));

    render(<NoteDetailActions noteId={mockNoteId} />);

    // 삭제 버튼 클릭
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    // 확인 다이얼로그에서 삭제 버튼 클릭
    const confirmButtons = screen.getAllByRole('button', { name: /삭제/i });
    const confirmButton = confirmButtons.find(btn => 
      btn.className.includes('bg-destructive')
    );
    
    if (confirmButton) {
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/노트 삭제 중 오류가 발생했습니다/i)).toBeInTheDocument();
      });
    }
  });
});

