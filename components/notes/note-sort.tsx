// components/notes/note-sort.tsx
// 노트 정렬 컴포넌트 - 노트 목록에서 정렬 옵션을 선택할 수 있는 드롭다운
// 사용자가 노트를 다양한 기준으로 정렬할 수 있도록 도와주는 UI 컴포넌트
// 관련 파일: app/notes/page.tsx, app/actions/notes.ts

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Calendar, FileText, Clock } from 'lucide-react';

interface NoteSortProps {
  currentSort: string;
}

export function NoteSort({ currentSort }: NoteSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'createdAt-desc') {
      // 기본값인 경우 파라미터 제거
      params.delete('sortBy');
      params.delete('sortOrder');
    } else {
      const [sortBy, sortOrder] = value.split('-');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    }
    
    // 페이지를 1로 리셋
    params.delete('page');
    
    router.push(`/notes?${params.toString()}`);
  };

  const getSortIcon = (value: string) => {
    if (value.includes('createdAt')) return <Calendar className="h-4 w-4" />;
    if (value.includes('updatedAt')) return <Clock className="h-4 w-4" />;
    if (value.includes('title')) return <FileText className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const getSortLabel = (value: string) => {
    const labels: Record<string, string> = {
      'createdAt-desc': '최신순',
      'createdAt-asc': '오래된순',
      'title-asc': '제목 오름차순',
      'title-desc': '제목 내림차순',
      'updatedAt-desc': '수정일 최신순',
      'updatedAt-asc': '수정일 오래된순',
    };
    return labels[value] || '정렬 기준';
  };

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          {getSortIcon(currentSort)}
          <SelectValue placeholder="정렬 기준" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="createdAt-desc">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>최신순</span>
          </div>
        </SelectItem>
        <SelectItem value="createdAt-asc">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>오래된순</span>
          </div>
        </SelectItem>
        <SelectItem value="title-asc">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>제목 오름차순</span>
          </div>
        </SelectItem>
        <SelectItem value="title-desc">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>제목 내림차순</span>
          </div>
        </SelectItem>
        <SelectItem value="updatedAt-desc">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>수정일 최신순</span>
          </div>
        </SelectItem>
        <SelectItem value="updatedAt-asc">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>수정일 오래된순</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
