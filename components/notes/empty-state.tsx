// components/notes/empty-state.tsx
// 빈 상태 컴포넌트 - 노트가 없을 때 표시되는 UI
// 첫 노트 작성을 유도하는 메시지와 버튼 제공
// 관련 파일: app/notes/page.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">아직 노트가 없습니다</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          첫 번째 노트를 작성하여 중요한 정보를 기록하고 관리해보세요
        </p>
        <Button asChild size="lg">
          <Link href="/notes/new">
            첫 노트 작성하기
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

