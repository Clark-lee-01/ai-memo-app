// components/trash/empty-trash-state.tsx
// 빈 휴지통 상태 컴포넌트 - 휴지통이 비었을 때 표시
// AI 메모장 프로젝트의 빈 휴지통 UI

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';

export function EmptyTrashState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Trash2 className="h-24 w-24 text-gray-300 dark:text-gray-600 mb-6" />
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        휴지통이 비어있습니다
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        삭제된 노트가 없습니다. 노트를 삭제하면 여기에 표시되며, 30일 후 자동으로 영구 삭제됩니다.
      </p>
      <div className="flex space-x-4">
        <Link href="/notes">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            노트 목록으로
          </Button>
        </Link>
        <Link href="/notes/new">
          <Button className="flex items-center">
            새 노트 작성
          </Button>
        </Link>
      </div>
    </div>
  );
}
