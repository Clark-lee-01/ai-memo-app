// components/notes/tags-editor.tsx
// 태그 편집 컴포넌트 - 태그 추가/삭제/수정 기능
// AI 메모장 프로젝트의 태그 편집 UI 컴포넌트
// 관련 파일: components/notes/tags-section.tsx, lib/hooks/useEditing.ts

'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle, Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useEditing } from '@/lib/hooks/useEditing';
import { updateNoteTags } from '@/app/actions/notes';

interface TagsEditorProps {
  noteId: string;
  initialTags: string[];
  onSave: (tags: string[]) => void;
  onCancel: () => void;
}

export function TagsEditor({ noteId, initialTags, onSave, onCancel }: TagsEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');

  // 편집 함수 정의
  const updateFunction = async (data: { title: string; content: string; summary?: string; tags?: string[] }) => {
    const result = await updateNoteTags(noteId, data.tags || []);
    return result;
  };

  // 편집 훅 사용
  const editing = useEditing('tags', updateFunction, {
    onSave: (result) => {
      onSave(result.tags || []);
    },
    onCancel: () => {
      onCancel();
    },
    onError: (error) => {
      console.error('태그 편집 실패:', error);
    }
  });

  // 편집 시작
  useEffect(() => {
    editing.startEditing({ title: '', content: '', tags: initialTags });
  }, [initialTags, editing]);

  // 태그 추가
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 6) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setNewTag('');
      editing.handleDataChange({ title: '', content: '', tags: newTags });
    }
  };

  // 태그 삭제
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    editing.handleDataChange({ title: '', content: '', tags: newTags });
  };

  // 엔터키로 태그 추가
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
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
          <span>태그를 저장하고 있습니다...</span>
        </div>
      )}

      {editing.isSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
          <span>태그가 성공적으로 저장되었습니다</span>
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

      {/* 태그 입력 */}
      <div className="space-y-2">
        <label htmlFor="tag-input" className="text-sm font-medium">
          태그 편집
        </label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="새 태그를 입력하세요..."
            disabled={editing.isSaving || tags.length >= 6}
            className="flex-1"
          />
          <Button
            onClick={handleAddTag}
            disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 6 || editing.isSaving}
            size="sm"
            variant="outline"
            className="h-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {tags.length}/6개 태그 (최대 6개까지)
        </div>
      </div>

      {/* 태그 목록 */}
      <div className="space-y-2">
        <div className="text-sm font-medium">현재 태그</div>
        {tags.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">
            태그가 없습니다. 위에서 태그를 추가해보세요.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span>{tag}</span>
                <Button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={editing.isSaving}
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
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
