// __tests__/pages/notes/[noteId]/edit/page.test.tsx
// 노트 수정 페이지 테스트 - 노트 수정 페이지 렌더링 및 기능 검증
// AI 메모장 프로젝트의 노트 수정 페이지 테스트

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NoteEditPage from '@/app/notes/[noteId]/edit/page';
import { getNote } from '@/app/actions/notes';

// Mock dependencies
jest.mock('@/app/actions/notes', () => ({
  getNote: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

const mockGetNote = getNote as jest.MockedFunction<typeof getNote>;

describe('NoteEditPage', () => {
  const mockNote = {
    id: 'test-note-id',
    userId: 'test-user-id',
    title: 'Test Note Title',
    content: 'Test note content',
    createdAt: new Date('2024-01-14T10:00:00Z'),
    updatedAt: new Date('2024-01-14T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('노트 데이터를 성공적으로 로드하고 수정 폼을 렌더링한다', async () => {
    mockGetNote.mockResolvedValueOnce(mockNote);

    render(<NoteEditPage params={{ noteId: 'test-note-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('노트 수정')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Note Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test note content')).toBeInTheDocument();
    });
  });

  it('노트를 찾을 수 없을 때 notFound를 호출한다', async () => {
    const { notFound } = require('next/navigation');
    mockGetNote.mockRejectedValueOnce(new Error('노트를 찾을 수 없습니다'));

    render(<NoteEditPage params={{ noteId: 'invalid-note-id' }} />);

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it('권한이 없을 때 notFound를 호출한다', async () => {
    const { notFound } = require('next/navigation');
    mockGetNote.mockRejectedValueOnce(new Error('로그인이 필요합니다'));

    render(<NoteEditPage params={{ noteId: 'unauthorized-note-id' }} />);

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it('노트가 null일 때 notFound를 호출한다', async () => {
    const { notFound } = require('next/navigation');
    mockGetNote.mockResolvedValueOnce(null);

    render(<NoteEditPage params={{ noteId: 'test-note-id' }} />);

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it('올바른 noteId로 getNote를 호출한다', async () => {
    mockGetNote.mockResolvedValueOnce(mockNote);

    render(<NoteEditPage params={{ noteId: 'test-note-id' }} />);

    await waitFor(() => {
      expect(mockGetNote).toHaveBeenCalledWith('test-note-id');
    });
  });

  it('NoteEditForm 컴포넌트에 올바른 props를 전달한다', async () => {
    mockGetNote.mockResolvedValueOnce(mockNote);

    render(<NoteEditPage params={{ noteId: 'test-note-id' }} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Note Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test note content')).toBeInTheDocument();
    });
  });
});
