// components/notes/summary-editor.tsx
// 요약 편집 컴포넌트 - 요약 텍스트 편집 기능
// AI 메모장 프로젝트의 요약 편집 UI 컴포넌트
// 관련 파일: components/notes/summary-section.tsx, lib/hooks/useEditing.ts

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle, Save, X, AlertCircle } from 'lucide-react';
import { useEditing } from '@/lib/hooks/useEditing';
import { updateNoteSummary } from '@/app/actions/notes';

interface SummaryEditorProps {
  noteId: string;
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function SummaryEditor({ noteId, initialContent, onSave, onCancel }: SummaryEditorProps) {
  const [content, setContent] = useState(initialContent);

  // 편집 함수 정의
  const updateFunction = async (data: { content: string }) => {
    const result = await updateNoteSummary(noteId, data.content);
    return result;
  };

  // 편집 훅 사용
  const editing = useEditing('summary', updateFunction, {
    onSave: (result) => {
      onSave(result.summary.content);
    },
    onCancel: () => {
      onCancel();
    },
    onError: (error) => {
      console.error('요약 편집 실패:', error);
    }
  });

  // 편집 시작
  useEffect(() => {
    editing.startEditing({ content: initialContent });
  }, [initialContent, editing]);

  // 내용 변경 처리
  const handleContentChange = (value: string) => {
    setContent(value);
    editing.handleDataChange({ content: value });
  };

  // 저장 처리
  const handleSave = () => {
    editing.saveEditing();
  };

  // 취소 처리
  const handleCancel = () => {
    editing.cancelEditing();
  };

  return (
    <div className="space-y-4">
      {/* 편집 중 상태 표시 */}
      {editing.isSaving && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>요약을 저장하고 있습니다...</span>
        </div>
      )}

      {editing.isSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
          <span>요약이 성공적으로 저장되었습니다</span>
        </div>
      )}

      {editing.hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {editing.getErrorMessage()}
          </AlertDescription>
        </Alert>
      )}

      {/* 편집 에디터 */}
      <div className="space-y-2">
        <label htmlFor="summary-editor" className="text-sm font-medium">
          요약 편집
        </label>
        <Textarea
          id="summary-editor"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="요약 내용을 입력하세요..."
          className="min-h-[120px] resize-none"
          disabled={editing.isSaving}
        />
        <div className="text-xs text-muted-foreground">
          {content.length}자
        </div>
      </div>

      {/* 편집 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!editing.canSave}
          size="sm"
          className="h-8"
        >
          {editing.isSaving ? (
            <>
              <LoaderCircle className="h-3 w-3 animate-spin mr-1" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              저장
            </>
          )}
        </Button>
        
        <Button
          onClick={handleCancel}
          disabled={!editing.canCancel}
          variant="outline"
          size="sm"
          className="h-8"
        >
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>

        {editing.hasChanges && (
          <span className="text-xs text-orange-600">
            변경사항이 있습니다
          </span>
        )}
      </div>
    </div>
  );
}
