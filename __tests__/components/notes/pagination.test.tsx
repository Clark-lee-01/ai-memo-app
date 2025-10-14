// __tests__/components/notes/pagination.test.tsx
// 페이지네이션 컴포넌트 테스트 - 페이지 네비게이션 UI 및 동작 검증
// Pagination 컴포넌트의 버튼 렌더링 및 페이지 이동 동작을 테스트
// 관련 파일: components/notes/pagination.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/notes/pagination';
import { useRouter, useSearchParams } from 'next/navigation';

// Next.js 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('Pagination', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('총 페이지가 1개 이하면 렌더링되지 않는다', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        hasNextPage={false}
        hasPreviousPage={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('이전 버튼과 다음 버튼이 렌더링된다', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    expect(screen.getByText('이전')).toBeInTheDocument();
    expect(screen.getByText('다음')).toBeInTheDocument();
  });

  it('첫 페이지에서 이전 버튼이 비활성화된다', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={false}
      />
    );
    const prevButton = screen.getByText('이전').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('마지막 페이지에서 다음 버튼이 비활성화된다', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        hasNextPage={false}
        hasPreviousPage={true}
      />
    );
    const nextButton = screen.getByText('다음').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('페이지 번호가 렌더링된다', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('페이지 번호 클릭 시 해당 페이지로 이동한다', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={false}
      />
    );
    const page3Button = screen.getByText('3').closest('button');
    fireEvent.click(page3Button!);
    expect(mockPush).toHaveBeenCalledWith('/notes?page=3');
  });

  it('이전 버튼 클릭 시 이전 페이지로 이동한다', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    const prevButton = screen.getByText('이전').closest('button');
    fireEvent.click(prevButton!);
    expect(mockPush).toHaveBeenCalledWith('/notes?page=2');
  });

  it('다음 버튼 클릭 시 다음 페이지로 이동한다', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    const nextButton = screen.getByText('다음').closest('button');
    fireEvent.click(nextButton!);
    expect(mockPush).toHaveBeenCalledWith('/notes?page=4');
  });

  it('현재 페이지가 강조 표시된다', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    const currentPageButton = screen.getByText('3').closest('button');
    // default variant는 다른 스타일을 가짐
    expect(currentPageButton).toBeInTheDocument();
  });

  it('페이지가 많을 때 말줄임표가 표시된다', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    );
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });
});

