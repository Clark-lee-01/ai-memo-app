// components/trash/trash-note-card.tsx
// 휴지통 노트 카드 컴포넌트 - 삭제된 노트 표시 및 액션
// AI 메모장 프로젝트의 휴지통 노트 카드 UI

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { restoreNote, permanentlyDeleteNote } from '@/app/actions/trash';
import { useRouter } from 'next/navigation';

interface TrashNoteCardProps {
  note: {
    id: string;
    title: string;
    content: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function TrashNoteCard({ note }: TrashNoteCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRestore = async () => {
    setError(null);
    startTransition(async () => {
      try {
        await restoreNote(note.id);
        router.refresh();
      } catch (err: unknown) {
        console.error('노트 복구 에러:', err);
        setError(err instanceof Error ? err.message : '노트 복구 중 오류가 발생했습니다.');
      }
    });
  };

  const handlePermanentDelete = async () => {
    if (!confirm('정말로 이 노트를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await permanentlyDeleteNote(note.id);
        router.refresh();
      } catch (err: unknown) {
        console.error('노트 영구 삭제 에러:', err);
        setError(err instanceof Error ? err.message : '노트 영구 삭제 중 오류가 발생했습니다.');
      }
    });
  };

  const deletedTimeAgo = note.deletedAt ? formatDistanceToNow(new Date(note.deletedAt), { 
    addSuffix: true, 
    locale: ko 
  }) : '알 수 없음';

  return (
    <Card className="h-full border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 text-gray-900 dark:text-white">
            {note.title}
          </CardTitle>
          <Badge variant="destructive" className="ml-2 flex-shrink-0">
            삭제됨
          </Badge>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="mr-1 h-3 w-3" />
          {deletedTimeAgo} 삭제
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {note.content && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
            {note.content}
          </p>
        )}
        
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-3">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={isPending}
            className="flex-1"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            복구
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePermanentDelete}
            disabled={isPending}
            className="flex-1"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            영구 삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
