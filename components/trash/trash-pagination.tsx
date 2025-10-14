// components/trash/trash-pagination.tsx
// 휴지통 페이지네이션 컴포넌트 - 휴지통 노트 목록 페이지네이션
// AI 메모장 프로젝트의 휴지통 페이지네이션 UI

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TrashPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function TrashPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
}: TrashPaginationProps) {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Link href={`/trash?page=${currentPage - 1}`}>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
      </Link>

      <div className="flex space-x-1">
        {pageNumbers.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm text-gray-500">...</span>
            ) : (
              <Link href={`/trash?page=${page}`}>
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  className="w-10"
                >
                  {page}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>

      <Link href={`/trash?page=${currentPage + 1}`}>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          className="flex items-center"
        >
          다음
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
