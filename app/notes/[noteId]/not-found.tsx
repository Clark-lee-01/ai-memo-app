// app/notes/[noteId]/not-found.tsx
// 노트 없음 페이지 - 노트를 찾을 수 없을 때 표시되는 페이지
// 404 에러 또는 권한 없는 노트 접근 시 표시
// 관련 파일: app/notes/[noteId]/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

export default function NoteNotFound() {
  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <Card className="text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">노트를 찾을 수 없습니다</CardTitle>
          <CardDescription className="text-base">
            요청하신 노트가 존재하지 않거나 접근 권한이 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            노트가 삭제되었거나 잘못된 링크일 수 있습니다.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/notes">
              <Button>노트 목록으로</Button>
            </Link>
            <Link href="/notes/new">
              <Button variant="outline">새 노트 작성</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

