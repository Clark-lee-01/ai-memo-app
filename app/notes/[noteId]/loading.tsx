// app/notes/[noteId]/loading.tsx
// 노트 상세 페이지 로딩 상태 - 노트 상세 페이지 로딩 중 표시되는 스켈레톤 UI
// 노트 상세 페이지 로딩 시 사용자에게 시각적 피드백 제공
// 관련 파일: app/notes/[noteId]/page.tsx, components/ui/skeleton.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NoteLoadingPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" className="gap-2" disabled>
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* 노트 내용 스켈레톤 */}
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}

