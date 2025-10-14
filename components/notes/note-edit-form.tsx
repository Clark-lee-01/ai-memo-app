// components/notes/note-edit-form.tsx
// 노트 수정 폼 컴포넌트 - 자동 저장 기능이 포함된 노트 수정 폼
// AI 메모장 프로젝트의 노트 수정 인터페이스

'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, ArrowLeft } from 'lucide-react';
import { updateNote } from '@/app/actions/notes';
import { NoteFormErrors } from '@/lib/types/notes';
import { validateNoteForm } from '@/lib/validations/notes';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { SaveStatusComponent } from '@/components/notes/save-status';

interface NoteEditFormProps {
  noteId: string;
  initialData: {
    title: string;
    content: string;
  };
}

export function NoteEditForm({ noteId, initialData }: NoteEditFormProps) {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [errors, setErrors] = useState<NoteFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 자동 저장 함수
  const handleAutoSave = useCallback(async (data: { title: string; content: string }) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      
      await updateNote(noteId, formData);
    } catch (error) {
      console.error('자동 저장 실패:', error);
      throw error;
    }
  }, [noteId]);

  // 자동 저장 훅
  const { saveStatus, hasUnsavedChanges, manualSave } = useAutoSave({
    data: { title, content },
    onSave: handleAutoSave,
    debounceMs: 2000, // 타이핑 중단 후 2초
    intervalMs: 5000, // 5초마다 주기적 저장
    enabled: true,
  });

  // 실시간 유효성 검사
  const validateField = (field: 'title' | 'content', value: string) => {
    const validation = validateNoteForm({ title, content: field === 'content' ? value : content });
    
    if (!validation.success && validation.error?.errors) {
      const fieldError = validation.error.errors.find(err => err.path.includes(field));
      return fieldError?.message;
    }
    
    return undefined;
  };

  // 제목 변경 핸들러
  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    // 실시간 유효성 검사
    const error = validateField('title', value);
    setErrors(prev => ({
      ...prev,
      title: error,
    }));
  };

  // 본문 변경 핸들러
  const handleContentChange = (value: string) => {
    setContent(value);
    
    // 실시간 유효성 검사
    const error = validateField('content', value);
    setErrors(prev => ({
      ...prev,
      content: error,
    }));
  };

  // 수동 저장 핸들러 (Ctrl+S)
  const handleManualSave = async () => {
    if (hasUnsavedChanges) {
      await manualSave();
    }
  };

  // 폼 제출 핸들러 (수정 완료)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 전체 폼 유효성 검사
    const validation = validateNoteForm({ title, content });
    if (!validation.success) {
      const newErrors: NoteFormErrors = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as keyof NoteFormErrors;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    // 에러 초기화
    setErrors({});

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);

        await updateNote(noteId, formData);
        
        // 성공 시 노트 상세 페이지로 리다이렉트
        router.push(`/notes/${noteId}?message=노트가 성공적으로 수정되었습니다`);
      } catch (error) {
        console.error('노트 수정 에러:', error);
        setErrors({ 
          general: '노트 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
      }
    });
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?');
      if (!confirmed) return;
    }
    router.push(`/notes/${noteId}`);
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    router.push(`/notes/${noteId}`);
  };

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleManualSave();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={isPending}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로
              </Button>
              <div>
                <CardTitle>노트 수정</CardTitle>
                <CardDescription>
                  노트의 제목과 본문을 수정하세요. 변경사항은 자동으로 저장됩니다.
                </CardDescription>
              </div>
            </div>
            <SaveStatusComponent status={saveStatus} />
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 일반 에러 메시지 */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* 자동 저장 안내 */}
            <Alert>
              <AlertDescription>
                💡 변경사항은 자동으로 저장됩니다. 수동 저장은 Ctrl+S를 사용하세요.
              </AlertDescription>
            </Alert>

            {/* 제목 입력 필드 */}
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="노트 제목을 입력하세요"
                className={errors.title ? 'border-red-500' : ''}
                disabled={isPending}
                maxLength={100}
              />
              <div className="flex justify-between text-sm text-gray-500">
                {errors.title ? (
                  <span className="text-red-500">{errors.title}</span>
                ) : (
                  <span>최대 100자까지 입력 가능합니다</span>
                )}
                <span>{title.length}/100</span>
              </div>
            </div>

            {/* 본문 입력 필드 */}
            <div className="space-y-2">
              <Label htmlFor="content">본문</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="노트 본문을 입력하세요"
                className={`min-h-[400px] ${errors.content ? 'border-red-500' : ''}`}
                disabled={isPending}
                maxLength={10000}
              />
              <div className="flex justify-between text-sm text-gray-500">
                {errors.content ? (
                  <span className="text-red-500">{errors.content}</span>
                ) : (
                  <span>최대 10,000자까지 입력 가능합니다</span>
                )}
                <span>{content.length}/10,000</span>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {hasUnsavedChanges && (
                  <span className="text-orange-600">⚠️ 저장되지 않은 변경사항이 있습니다</span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={isPending || !hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  수동 저장
                </Button>
                
                <Button
                  type="submit"
                  disabled={isPending || !title.trim()}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      수정 완료
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
