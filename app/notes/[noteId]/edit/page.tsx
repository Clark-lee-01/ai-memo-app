// app/notes/[noteId]/edit/page.tsx
// 노트 수정 페이지 - 기존 노트를 수정하는 페이지
// AI 메모장 프로젝트의 노트 수정 인터페이스

import { getNote } from '@/app/actions/notes';
import { notFound } from 'next/navigation';
import { NoteEditForm } from '@/components/notes/note-edit-form';

interface NoteEditPageProps {
  params: {
    noteId: string;
  };
}

export default async function NoteEditPage({ params }: NoteEditPageProps) {
  const { noteId } = params;
  
  let note;
  try {
    note = await getNote(noteId);
  } catch (error) {
    console.error('노트 조회 실패:', error);
    notFound(); // 노트가 없거나 권한이 없는 경우 404 페이지 표시
  }

  if (!note) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NoteEditForm 
        noteId={noteId}
        initialData={{
          title: note.title,
          content: note.content || '',
        }}
      />
    </div>
  );
}
