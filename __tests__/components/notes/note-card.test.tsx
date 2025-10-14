// __tests__/components/notes/note-card.test.tsx
// 노트 카드 컴포넌트 테스트 - 노트 카드 렌더링 및 동작 검증
// NoteCard 컴포넌트의 UI 렌더링 및 클릭 동작을 테스트
// 관련 파일: components/notes/note-card.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NoteCard } from '@/components/notes/note-card';
import { Note } from '@/lib/types/notes';

// Next.js Link 모킹
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// date-fns 모킹
jest.mock('date-fns', () => ({
  formatDistanceToNow: () => '5분 전',
}));

describe('NoteCard', () => {
  const mockNote: Note = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    title: '테스트 노트',
    content: '이것은 테스트 노트의 내용입니다.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  it('노트 제목이 렌더링된다', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('테스트 노트')).toBeInTheDocument();
  });

  it('노트 본문 미리보기가 렌더링된다', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('이것은 테스트 노트의 내용입니다.')).toBeInTheDocument();
  });

  it('작성 시간이 상대적인 시간으로 표시된다', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('5분 전')).toBeInTheDocument();
  });

  it('본문이 100자를 초과하면 말줄임표가 추가된다', () => {
    const longNote: Note = {
      ...mockNote,
      content: 'a'.repeat(150),
    };
    render(<NoteCard note={longNote} />);
    const contentElement = screen.getByText(/^a+\.\.\./);
    expect(contentElement.textContent?.length).toBeLessThanOrEqual(104); // 100 + '...'
  });

  it('본문이 없으면 "내용 없음"이 표시된다', () => {
    const noteWithoutContent: Note = {
      ...mockNote,
      content: null,
    };
    render(<NoteCard note={noteWithoutContent} />);
    expect(screen.getByText('내용 없음')).toBeInTheDocument();
  });

  it('노트 상세 페이지로의 링크가 올바르게 설정된다', () => {
    render(<NoteCard note={mockNote} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', `/notes/${mockNote.id}`);
  });
});

