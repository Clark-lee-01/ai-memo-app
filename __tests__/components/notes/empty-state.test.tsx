// __tests__/components/notes/empty-state.test.tsx
// 빈 상태 컴포넌트 테스트 - 노트가 없을 때 표시되는 UI 검증
// EmptyState 컴포넌트의 렌더링 및 버튼 동작을 테스트
// 관련 파일: components/notes/empty-state.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/notes/empty-state';

// Next.js Link 모킹
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('EmptyState', () => {
  it('빈 상태 메시지가 렌더링된다', () => {
    render(<EmptyState />);
    expect(screen.getByText('아직 노트가 없습니다')).toBeInTheDocument();
  });

  it('안내 메시지가 렌더링된다', () => {
    render(<EmptyState />);
    expect(
      screen.getByText(/첫 번째 노트를 작성하여 중요한 정보를 기록하고 관리해보세요/)
    ).toBeInTheDocument();
  });

  it('노트 작성 버튼이 렌더링된다', () => {
    render(<EmptyState />);
    expect(screen.getByText('첫 노트 작성하기')).toBeInTheDocument();
  });

  it('노트 작성 버튼이 올바른 링크를 가진다', () => {
    render(<EmptyState />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/notes/new');
  });

  it('아이콘이 렌더링된다', () => {
    const { container } = render(<EmptyState />);
    const iconElement = container.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });
});

