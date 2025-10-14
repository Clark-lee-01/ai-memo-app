// components/notes/note-card.tsx
// 노트 카드 컴포넌트 - 노트 목록에서 개별 노트를 표시하는 카드
// 제목, 본문 미리보기, 작성일시를 포함하며 클릭 시 상세 페이지로 이동
// 관련 파일: app/notes/page.tsx, lib/types/notes.ts

'use client';

import Link from 'next/link';
import { Note } from '@/lib/types/notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  // 본문 미리보기 (100자 제한)
  const contentPreview = note.content
    ? note.content.length > 100
      ? `${note.content.slice(0, 100)}...`
      : note.content
    : '내용 없음';

  // 날짜 포맷팅
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Link href={`/notes/${note.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl line-clamp-1">{note.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {timeAgo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {contentPreview}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

