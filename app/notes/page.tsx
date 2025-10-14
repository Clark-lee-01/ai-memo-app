// app/notes/page.tsx
// 노트 목록 페이지 - 사용자의 모든 노트를 페이지네이션과 함께 표시
// Server Component로 구현되어 서버에서 데이터를 가져와 렌더링
// 관련 파일: components/notes/note-card.tsx, components/notes/pagination.tsx, app/actions/notes.ts

import Link from 'next/link';
import { Suspense } from 'react';
import { getNotes } from '@/app/actions/notes';
import { NoteCard } from '@/components/notes/note-card';
import { EmptyState } from '@/components/notes/empty-state';
import { Pagination } from '@/components/notes/pagination';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Home } from 'lucide-react';
import NotesLoading from './loading';

interface NotesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

async function NotesList({ page }: { page: number }) {
  try {
    const { notes, totalCount, totalPages, currentPage, hasNextPage, hasPreviousPage } = 
      await getNotes({ page });

    // 노트가 없는 경우 빈 상태 표시
    if (notes.length === 0 && page === 1) {
      return <EmptyState />;
    }

    // 잘못된 페이지 번호
    if (notes.length === 0 && page > 1) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            요청한 페이지를 찾을 수 없습니다. 
            <Link href="/notes" className="underline ml-1">
              첫 페이지로 돌아가기
            </Link>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        {/* 노트 카드 그리드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>

        {/* 페이지네이션 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />

        {/* 총 노트 수 표시 */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          총 {totalCount}개의 노트
        </div>
      </>
    );
  } catch (error) {
    console.error('노트 목록 조회 실패:', error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          노트 목록을 불러오는 중 오류가 발생했습니다. 
          <button 
            onClick={() => window.location.reload()} 
            className="underline ml-1"
          >
            다시 시도
          </button>
        </AlertDescription>
      </Alert>
    );
  }
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="container max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">내 노트</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              메인으로
            </Link>
          </Button>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="h-4 w-4 mr-2" />
            새 노트 작성
          </Link>
        </Button>
      </div>

      {/* 노트 목록 */}
      <Suspense fallback={<NotesLoading />}>
        <NotesList page={page} />
      </Suspense>
    </div>
  );
}

