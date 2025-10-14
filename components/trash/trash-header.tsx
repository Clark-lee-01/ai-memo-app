// components/trash/trash-header.tsx
// 휴지통 헤더 컴포넌트 - 휴지통 제목과 비우기 버튼
// AI 메모장 프로젝트의 휴지통 헤더 UI

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { EmptyTrashDialog } from './empty-trash-dialog';

interface TrashHeaderProps {
  totalCount: number;
}

export function TrashHeader({ totalCount }: TrashHeaderProps) {
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trash2 className="mr-3 h-8 w-8 text-red-500" />
            휴지통
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {totalCount > 0 
              ? `삭제된 노트 ${totalCount}개가 있습니다. 30일 후 자동으로 영구 삭제됩니다.`
              : '삭제된 노트가 없습니다.'
            }
          </p>
        </div>
        
        {totalCount > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowEmptyDialog(true)}
            className="flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            휴지통 비우기
          </Button>
        )}
      </div>

      <EmptyTrashDialog
        open={showEmptyDialog}
        onOpenChange={setShowEmptyDialog}
        totalCount={totalCount}
      />
    </>
  );
}
