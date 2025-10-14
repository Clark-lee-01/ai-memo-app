// components/notes/empty-state.tsx
// 빈 상태 컴포넌트 - 노트가 없을 때 표시되는 UI
// 다양한 variant를 지원하여 상황에 맞는 메시지와 행동 유도 제공
// 관련 파일: app/notes/page.tsx, app/page.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Sparkles, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  illustration?: ReactNode;
  variant?: 'default' | 'welcome' | 'deleted';
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel = "첫 노트 작성하기",
  actionHref = "/notes/new",
  illustration,
  variant = "default",
  className = ""
}: EmptyStateProps) {
  // variant에 따른 기본값 설정
  const getDefaultContent = () => {
    switch (variant) {
      case 'welcome':
        return {
          title: "첫 번째 노트를 작성해보세요",
          description: "AI 메모장에서 아이디어를 기록하고 관리해보세요. 간단하고 직관적인 인터페이스로 언제든지 메모를 작성할 수 있습니다.",
          actionLabel: "노트 작성하기"
        };
      case 'deleted':
        return {
          title: "모든 노트가 삭제되었습니다",
          description: "새로운 노트를 작성하여 다시 시작해보세요. 삭제된 노트는 복구할 수 없습니다.",
          actionLabel: "새 노트 작성하기"
        };
      default:
        return {
          title: "아직 노트가 없습니다",
          description: "첫 번째 노트를 작성하여 중요한 정보를 기록하고 관리해보세요",
          actionLabel: "첫 노트 작성하기"
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalActionLabel = actionLabel || defaultContent.actionLabel;

  // variant에 따른 일러스트레이션
  const getIllustration = () => {
    if (illustration) return illustration;

    switch (variant) {
      case 'welcome':
        return (
          <div className="rounded-full bg-blue-50 p-6 mb-4">
            <Sparkles className="h-12 w-12 text-blue-400" />
          </div>
        );
      case 'deleted':
        return (
          <div className="rounded-full bg-red-50 p-6 mb-4">
            <Trash2 className="h-12 w-12 text-red-400" />
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-muted p-6 mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        );
    }
  };

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {getIllustration()}
        <h3 className="text-2xl font-semibold mb-3 text-gray-900">
          {finalTitle}
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
          {finalDescription}
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href={actionHref}>
            <Plus className="h-5 w-5" />
            {finalActionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

