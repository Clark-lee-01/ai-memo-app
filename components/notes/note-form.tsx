// components/notes/note-form.tsx
// 노트 작성 폼 컴포넌트 - 노트 생성 및 수정을 위한 폼 UI
// AI 메모장 프로젝트의 노트 작성 인터페이스

'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
import { createNote, updateNote } from '@/app/actions/notes';
import { NoteFormErrors } from '@/lib/types/notes';
import { validateNoteForm } from '@/lib/validations/notes';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { SaveStatusComponent } from '@/components/notes/save-status';
import { RecoveryDialog } from '@/components/notes/recovery-dialog';
import { getTempData, clearTempData, createTempStorageKey } from '@/lib/utils/tempStorage';

interface NoteFormProps {
  initialData?: {
    title?: string;
    content?: string;
  };
  mode?: 'create' | 'edit';
  noteId?: string; // 수정 모드일 때 노트 ID
  onCancel?: () => void;
  enableRecovery?: boolean; // 데이터 복구 기능 활성화
}

export function NoteForm({ 
  initialData = { title: '', content: '' }, 
  mode = 'create',
  noteId,
  onCancel,
  enableRecovery = false
}: NoteFormProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [content, setContent] = useState(initialData.content || '');
  const [errors, setErrors] = useState<NoteFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  const router = useRouter();

  // 자동 저장 함수 (수정 모드일 때만)
  const handleAutoSave = useCallback(async (data: { title: string; content: string }) => {
    if (mode === 'edit' && noteId) {
      try {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('content', data.content);
        
        await updateNote(noteId, formData);
      } catch (error) {
        console.error('자동 저장 실패:', error);
        throw error;
      }
    }
  }, [mode, noteId]);

  // 자동 저장 훅 (모든 모드에서 활성화)
  const { saveStatus, hasUnsavedChanges, manualSave } = useAutoSave({
    data: { title, content },
    onSave: mode === 'edit' && noteId ? handleAutoSave : undefined,
    debounceMs: 2000, // 타이핑 중단 후 2초
    intervalMs: 3000, // 3초마다 주기적 저장
    enabled: true,
    noteId,
    enableTempSave: true,
  });

  // 페이지 로드 시 임시 저장 데이터 확인
  useEffect(() => {
    if (!enableRecovery) return;

    const storageKey = createTempStorageKey(noteId);
    const tempData = getTempData(storageKey);
    
    if (tempData && tempData.data) {
      // 초기 데이터가 비어있고 임시 저장 데이터가 있는 경우에만 복구 다이얼로그 표시
      const hasInitialData = initialData.title || initialData.content;
      if (!hasInitialData) {
        setTempData(tempData);
        setShowRecoveryDialog(true);
      }
    }
  }, [enableRecovery, noteId, initialData]);

  // 복구 처리
  const handleRecover = useCallback(() => {
    if (tempData?.data) {
      setTitle(tempData.data.title || '');
      setContent(tempData.data.content || '');
      
      // 임시 저장 데이터 삭제
      const storageKey = createTempStorageKey(noteId);
      clearTempData(storageKey);
    }
    
    setShowRecoveryDialog(false);
    setTempData(null);
  }, [tempData, noteId]);

  // 복구 거부 처리
  const handleDiscard = useCallback(() => {
    // 임시 저장 데이터 삭제
    const storageKey = createTempStorageKey(noteId);
    clearTempData(storageKey);
    
    setShowRecoveryDialog(false);
    setTempData(null);
  }, [noteId]);

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

        if (mode === 'edit' && noteId) {
          // 수정 모드
          await updateNote(noteId, formData);
          // 임시 저장 데이터 삭제
          const storageKey = createTempStorageKey(noteId);
          clearTempData(storageKey);
          // 성공 시 노트 상세 페이지로 리다이렉트
          router.push(`/notes/${noteId}?message=노트가 성공적으로 수정되었습니다`);
        } else {
          // 생성 모드
          const result = await createNote(formData);
          
          if (!result.success) {
            setErrors({ general: result.error });
          } else {
            // 임시 저장 데이터 삭제
            const storageKey = createTempStorageKey();
            clearTempData(storageKey);
            // 성공 시 노트 목록 페이지로 리다이렉트
            router.push('/notes');
          }
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
    if (mode === 'edit' && hasUnsavedChanges) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?');
      if (!confirmed) return;
    }
    
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // 폼이 변경되었는지 확인
  const hasChanges = title !== initialData.title || content !== initialData.content;

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (mode === 'edit' && hasUnsavedChanges) {
        manualSave();
      }
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {mode === 'create' ? '새 노트 작성' : '노트 수정'}
            </CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? '제목과 본문을 입력하여 새로운 노트를 작성하세요.'
                : '노트의 제목과 본문을 수정하세요. 변경사항은 자동으로 저장됩니다.'
              }
            </CardDescription>
          </div>
          {mode === 'edit' && (
            <SaveStatusComponent status={saveStatus} />
          )}
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
              💡 변경사항은 자동으로 임시 저장됩니다. 
              {mode === 'edit' ? ' 서버 저장은 Ctrl+S를 사용하세요.' : ' 정식 저장을 위해 저장 버튼을 클릭하세요.'}
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
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {mode === 'edit' && hasUnsavedChanges && (
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
              
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={manualSave}
                  disabled={isPending || !hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  수동 저장
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={isPending || !title.trim() || (mode === 'create' && !hasChanges)}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? '생성 중...' : '수정 중...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? '노트 생성' : '수정 완료'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* 데이터 복구 다이얼로그 */}
    <RecoveryDialog
      isOpen={showRecoveryDialog}
      onRecover={handleRecover}
      onDiscard={handleDiscard}
      tempData={tempData?.data ? {
        title: tempData.data.title,
        content: tempData.data.content,
        timestamp: tempData.timestamp
      } : undefined}
    />
    </div>
  );
}
