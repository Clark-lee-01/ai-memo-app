// app/notes/[noteId]/page.tsx
// 노트 상세 페이지 - 개별 노트의 전체 내용을 표시하는 페이지
// 제목, 본문, 작성일시, 수정일시를 표시하고 수정/삭제 기능 제공
// 관련 파일: app/actions/notes.ts, components/notes/note-detail-actions.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getNote, getNoteSummary, getNoteTags } from '@/app/actions/notes';
import { NoteDetailActions } from '@/components/notes/note-detail-actions';
import { SummarySection } from '@/components/notes/summary-section';
import TagsSection from '@/components/notes/tags-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NotePage({ params }: PageProps) {
  const { noteId } = await params;

  // 노트 조회
  let note;
  let summary;
  let tags;
  try {
    note = await getNote(noteId);
    summary = await getNoteSummary(noteId);
    tags = await getNoteTags(noteId);
  } catch (error) {
    console.error('노트 조회 실패:', error);
    notFound();
  }

  // 날짜 포맷팅
  const createdAt = format(new Date(note.createdAt), 'yyyy년 M월 d일 a h:mm', { locale: ko });
  const updatedAt = format(new Date(note.updatedAt), 'yyyy년 M월 d일 a h:mm', { locale: ko });

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* 헤더 - 목록으로 돌아가기 및 액션 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/notes">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
        
        <NoteDetailActions noteId={note.id} />
      </div>

      {/* AI 요약 섹션 */}
      <SummarySection noteId={note.id} initialSummary={summary} />

      {/* AI 태그 섹션 */}
      <TagsSection noteId={note.id} initialTags={tags} />

      {/* 노트 내용 */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-bold">{note.title}</CardTitle>
          <CardDescription className="text-sm space-x-4">
            <span>작성: {createdAt}</span>
            {note.updatedAt !== note.createdAt && (
              <span>| 수정: {updatedAt}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {note.content || '내용이 없습니다.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

