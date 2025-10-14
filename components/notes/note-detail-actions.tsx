// components/notes/note-detail-actions.tsx
// 노트 상세 페이지 액션 버튼 - 수정 및 삭제 버튼
// 노트 상세 페이지에서 사용되는 클라이언트 컴포넌트
// 관련 파일: app/notes/[noteId]/page.tsx, app/actions/notes.ts

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { deleteNote } from '@/app/actions/notes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NoteDetailActionsProps {
  noteId: string;
}

export function NoteDetailActions({ noteId }: NoteDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteNote(noteId);
        if (result.success) {
          // 성공 시 노트 목록 페이지로 리다이렉트
          router.push('/notes?message=' + encodeURIComponent(result.message || '노트가 삭제되었습니다'));
        } else {
          setError(result.error || '노트 삭제 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('노트 삭제 에러:', err);
        setError('노트 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  };

  const handleEdit = () => {
    router.push(`/notes/${noteId}/edit`);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleEdit} variant="outline" className="gap-2">
        <Edit className="h-4 w-4" />
        수정
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="gap-2" disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="absolute top-20 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

