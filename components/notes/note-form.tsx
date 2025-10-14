// components/notes/note-form.tsx
// 노트 작성 폼 컴포넌트 - 노트 생성 및 수정을 위한 폼 UI
// AI 메모장 프로젝트의 노트 작성 인터페이스

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
import { createNote } from '@/app/actions/notes';
import { NoteFormErrors } from '@/lib/types/notes';
import { validateNoteForm } from '@/lib/validations/notes';

interface NoteFormProps {
  initialData?: {
    title?: string;
    content?: string;
  };
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

export function NoteForm({ 
  initialData = { title: '', content: '' }, 
  mode = 'create',
  onCancel 
}: NoteFormProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [content, setContent] = useState(initialData.content || '');
  const [errors, setErrors] = useState<NoteFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  // 폼 제출 핸들러
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

        const result = await createNote(formData);
        
        if (!result.success) {
          setErrors({ general: result.error });
        } else {
          // 성공 시 노트 상세 페이지로 리다이렉트
          router.push(`/notes/${result.noteId}?message=노트가 성공적으로 생성되었습니다`);
        }
      } catch (error) {
        console.error('노트 저장 에러:', error);
        setErrors({ 
          general: '노트 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
      }
    });
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // 폼이 변경되었는지 확인
  const hasChanges = title !== initialData.title || content !== initialData.content;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '새 노트 작성' : '노트 수정'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? '제목과 본문을 입력하여 새로운 노트를 작성하세요.'
            : '노트의 제목과 본문을 수정하세요.'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 일반 에러 메시지 */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

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
              className={`min-h-[300px] ${errors.content ? 'border-red-500' : ''}`}
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
          <div className="flex justify-end space-x-3">
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
              type="submit"
              disabled={isPending || !title.trim() || !hasChanges}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? '노트 생성' : '노트 수정'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
