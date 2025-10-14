// app/notes/[noteId]/edit/loading.tsx
// 노트 수정 페이지 로딩 상태 - 노트 데이터 로딩 중 표시
// AI 메모장 프로젝트의 노트 수정 로딩 UI

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NoteEditLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="w-full">
        <div className="border rounded-lg p-6">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로
              </Button>
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>

          {/* 폼 영역 */}
          <div className="space-y-6">
            {/* 제목 필드 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* 본문 필드 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-48" />
              <div className="flex space-x-3">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
