// __tests__/components/trash/trash-note-card.test.tsx
// 휴지통 노트 카드 컴포넌트 테스트
// AI 메모장 프로젝트의 휴지통 노트 카드 테스트

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashNoteCard } from '@/components/trash/trash-note-card';

// Mock dependencies
const mockRestoreNote = jest.fn();
const mockPermanentlyDeleteNote = jest.fn();
const mockRefresh = jest.fn();

jest.mock('@/app/actions/trash', () => ({
  restoreNote: (...args: any[]) => mockRestoreNote(...args),
  permanentlyDeleteNote: (...args: any[]) => mockPermanentlyDeleteNote(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
  writable: true,
});

describe('TrashNoteCard', () => {
  const mockNote = {
    id: 'note-1',
    title: 'Test Note',
    content: 'Test content',
    deletedAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  it('노트 정보를 렌더링한다', () => {
    render(<TrashNoteCard note={mockNote} />);

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('삭제됨')).toBeInTheDocument();
  });

  it('복구 버튼을 렌더링한다', () => {
    render(<TrashNoteCard note={mockNote} />);

    expect(screen.getByRole('button', { name: /복구/i })).toBeInTheDocument();
  });

  it('영구 삭제 버튼을 렌더링한다', () => {
    render(<TrashNoteCard note={mockNote} />);

    expect(screen.getByRole('button', { name: /영구 삭제/i })).toBeInTheDocument();
  });

  it('복구 버튼 클릭 시 노트를 복구한다', async () => {
    const user = userEvent.setup();
    mockRestoreNote.mockResolvedValueOnce(undefined);

    render(<TrashNoteCard note={mockNote} />);

    await user.click(screen.getByRole('button', { name: /복구/i }));

    await waitFor(() => {
      expect(mockRestoreNote).toHaveBeenCalledWith('note-1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('영구 삭제 버튼 클릭 시 확인 후 노트를 영구 삭제한다', async () => {
    const user = userEvent.setup();
    mockPermanentlyDeleteNote.mockResolvedValueOnce(undefined);

    render(<TrashNoteCard note={mockNote} />);

    await user.click(screen.getByRole('button', { name: /영구 삭제/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      '정말로 이 노트를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    );

    await waitFor(() => {
      expect(mockPermanentlyDeleteNote).toHaveBeenCalledWith('note-1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('영구 삭제 확인을 취소하면 삭제하지 않는다', async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<TrashNoteCard note={mockNote} />);

    await user.click(screen.getByRole('button', { name: /영구 삭제/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockPermanentlyDeleteNote).not.toHaveBeenCalled();
  });

  it('복구 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    mockRestoreNote.mockRejectedValueOnce(new Error('복구 실패'));

    render(<TrashNoteCard note={mockNote} />);

    await user.click(screen.getByRole('button', { name: /복구/i }));

    await waitFor(() => {
      expect(screen.getByText('복구 실패')).toBeInTheDocument();
    });
  });

  it('영구 삭제 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    mockPermanentlyDeleteNote.mockRejectedValueOnce(new Error('영구 삭제 실패'));

    render(<TrashNoteCard note={mockNote} />);

    await user.click(screen.getByRole('button', { name: /영구 삭제/i }));

    await waitFor(() => {
      expect(screen.getByText('영구 삭제 실패')).toBeInTheDocument();
    });
  });

  it('로딩 중일 때 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();
    mockRestoreNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TrashNoteCard note={mockNote} />);

    const restoreButton = screen.getByRole('button', { name: /복구/i });
    const deleteButton = screen.getByRole('button', { name: /영구 삭제/i });

    await user.click(restoreButton);

    expect(restoreButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
});
