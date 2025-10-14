// components/trash/empty-trash-dialog.tsx
// 휴지통 비우기 다이얼로그 컴포넌트 - 휴지통 비우기 확인
// AI 메모장 프로젝트의 휴지통 비우기 다이얼로그 UI

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { emptyTrash } from '@/app/actions/trash';

interface EmptyTrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
}

export function EmptyTrashDialog({ open, onOpenChange, totalCount }: EmptyTrashDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmptyTrash = async () => {
    setError(null);
    startTransition(async () => {
      try {
        await emptyTrash();
        onOpenChange(false);
        router.refresh();
      } catch (err: any) {
        console.error('휴지통 비우기 에러:', err);
        setError(err.message || '휴지통 비우기 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>휴지통 비우기</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 휴지통의 모든 노트({totalCount}개)를 영구 삭제하시겠습니까?
            <br />
            <strong>이 작업은 되돌릴 수 없습니다.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEmptyTrash}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? '삭제 중...' : '영구 삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
