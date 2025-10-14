// __tests__/pages/trash/page.test.tsx
// 휴지통 페이지 테스트
// AI 메모장 프로젝트의 휴지통 페이지 테스트

import React from 'react';
import { render, screen } from '@testing-library/react';
import TrashPage from '@/app/trash/page';

// Mock dependencies
const mockGetTrashNotes = jest.fn();

jest.mock('@/app/actions/trash', () => ({
  getTrashNotes: (...args: any[]) => mockGetTrashNotes(...args),
}));

jest.mock('@/components/trash/trash-note-card', () => ({
  TrashNoteCard: ({ note }: { note: any }) => (
    <div data-testid={`trash-note-${note.id}`}>
      {note.title}
    </div>
  ),
}));

jest.mock('@/components/trash/empty-trash-state', () => ({
  EmptyTrashState: () => <div data-testid="empty-trash-state">Empty Trash</div>,
}));

jest.mock('@/components/trash/trash-header', () => ({
  TrashHeader: ({ totalCount }: { totalCount: number }) => (
    <div data-testid="trash-header">Header - {totalCount} notes</div>
  ),
}));

jest.mock('@/components/trash/trash-pagination', () => ({
  TrashPagination: () => <div data-testid="trash-pagination">Pagination</div>,
}));

describe('TrashPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('휴지통 노트 목록을 렌더링한다', async () => {
    const mockTrashData = {
      notes: [
        {
          id: 'note-1',
          title: 'Test Note 1',
          content: 'Test content 1',
          deletedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'note-2',
          title: 'Test Note 2',
          content: 'Test content 2',
          deletedAt: new Date('2024-01-16'),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ],
      totalCount: 2,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    mockGetTrashNotes.mockResolvedValueOnce(mockTrashData);

    const TrashPageComponent = await TrashPage({ searchParams: { page: '1' } });
    render(TrashPageComponent);

    expect(screen.getByTestId('trash-header')).toBeInTheDocument();
    expect(screen.getByTestId('trash-note-note-1')).toBeInTheDocument();
    expect(screen.getByTestId('trash-note-note-2')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-trash-state')).not.toBeInTheDocument();
  });

  it('빈 휴지통 상태를 렌더링한다', async () => {
    const mockTrashData = {
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    mockGetTrashNotes.mockResolvedValueOnce(mockTrashData);

    const TrashPageComponent = await TrashPage({ searchParams: {} });
    render(TrashPageComponent);

    expect(screen.getByTestId('empty-trash-state')).toBeInTheDocument();
    expect(screen.queryByTestId('trash-note-note-1')).not.toBeInTheDocument();
  });

  it('페이지네이션이 있을 때 페이지네이션을 렌더링한다', async () => {
    const mockTrashData = {
      notes: [{ id: 'note-1', title: 'Test Note', content: 'Test content', deletedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }],
      totalCount: 25,
      totalPages: 2,
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false,
    };

    mockGetTrashNotes.mockResolvedValueOnce(mockTrashData);

    const TrashPageComponent = await TrashPage({ searchParams: { page: '1' } });
    render(TrashPageComponent);

    expect(screen.getByTestId('trash-pagination')).toBeInTheDocument();
  });

  it('데이터 로딩 실패 시 에러 메시지를 표시한다', async () => {
    mockGetTrashNotes.mockRejectedValueOnce(new Error('Database error'));

    const TrashPageComponent = await TrashPage({ searchParams: {} });
    render(TrashPageComponent);

    expect(screen.getByText('휴지통 로딩 실패')).toBeInTheDocument();
    expect(screen.getByText('휴지통 데이터를 불러오는 중 오류가 발생했습니다.')).toBeInTheDocument();
  });

  it('기본 페이지 번호를 1로 설정한다', async () => {
    const mockTrashData = {
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    mockGetTrashNotes.mockResolvedValueOnce(mockTrashData);

    const TrashPageComponent = await TrashPage({ searchParams: {} });
    render(TrashPageComponent);

    expect(mockGetTrashNotes).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
