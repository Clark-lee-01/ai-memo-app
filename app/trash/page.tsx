// app/trash/page.tsx
// 휴지통 페이지 - 삭제된 노트 목록 및 관리
// AI 메모장 프로젝트의 휴지통 기능 페이지

import { getTrashNotes } from '@/app/actions/trash';
import { TrashNoteCard } from '@/components/trash/trash-note-card';
import { EmptyTrashState } from '@/components/trash/empty-trash-state';
import { TrashHeader } from '@/components/trash/trash-header';
import { TrashPagination } from '@/components/trash/trash-pagination';
import { Suspense } from 'react';

interface TrashPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function TrashPage({ searchParams }: TrashPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  
  let trashData;
  try {
    trashData = await getTrashNotes({ page, limit: 20 });
  } catch (error) {
    console.error('휴지통 데이터 로딩 실패:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">휴지통 로딩 실패</h1>
          <p className="text-gray-600">휴지통 데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  const { notes, totalCount, totalPages, currentPage, hasNextPage, hasPreviousPage } = trashData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={<div>로딩 중...</div>}>
        <TrashHeader totalCount={totalCount} />
      </Suspense>

      {notes.length === 0 ? (
        <EmptyTrashState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <TrashNoteCard key={note.id} note={note} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <TrashPagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
            />
          )}
        </>
      )}
    </div>
  );
}
