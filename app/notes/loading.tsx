// app/notes/loading.tsx
// 노트 목록 로딩 상태 - 데이터 로딩 중 표시되는 스켈레톤 UI
// Next.js App Router의 loading.tsx 컨벤션 활용
// 관련 파일: app/notes/page.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesLoading() {
  return (
    <div className="container max-w-6xl mx-auto p-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* 노트 카드 스켈레톤 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

