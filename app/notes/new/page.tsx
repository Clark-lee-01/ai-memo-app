// app/notes/new/page.tsx
// 노트 작성 페이지 - 새 노트를 생성하는 페이지
// AI 메모장 프로젝트의 노트 생성 인터페이스

import { Suspense } from 'react';
import { NoteForm } from '@/components/notes/note-form';
import { AuthGuard } from '@/components/ui/auth-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// 로딩 컴포넌트
function NoteFormSkeleton() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-[300px] bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-end space-x-3">
            <div className="h-10 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 노트 작성 페이지 컴포넌트
function NewNotePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">새 노트 작성</h1>
        <p className="text-gray-600 mt-2">
          중요한 정보를 체계적으로 기록하고 관리하세요.
        </p>
      </div>

      <Suspense fallback={<NoteFormSkeleton />}>
        <NoteForm mode="create" />
      </Suspense>
    </div>
  );
}

// 메인 페이지 컴포넌트 (인증 보호)
export default function Page() {
  return (
    <AuthGuard>
      <NewNotePage />
    </AuthGuard>
  );
}

