// components/notes/pagination.tsx
// 페이지네이션 컴포넌트 - 노트 목록의 페이지 네비게이션 UI
// 이전/다음 버튼과 페이지 번호 표시
// 관련 파일: app/notes/page.tsx, lib/types/notes.ts

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/notes?${params.toString()}`);
  };

  // 페이지가 1개 이하면 페이지네이션 숨김
  if (totalPages <= 1) {
    return null;
  }

  // 표시할 페이지 번호 계산 (현재 페이지 주변 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </Button>

      {/* 페이지 번호 */}
      <div className="flex gap-1">
        {/* 첫 페이지 */}
        {pageNumbers[0] > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(1)}
              className="min-w-[2.5rem]"
            >
              1
            </Button>
            {pageNumbers[0] > 2 && (
              <span className="flex items-center px-2">...</span>
            )}
          </>
        )}

        {/* 중간 페이지들 */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(page)}
            className="min-w-[2.5rem]"
          >
            {page}
          </Button>
        ))}

        {/* 마지막 페이지 */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="flex items-center px-2">...</span>
            )}
            <Button
              variant={currentPage === totalPages ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="min-w-[2.5rem]"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="gap-1"
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

