// components/notes/recovery-dialog.tsx
// 데이터 복구 다이얼로그 - 임시 저장된 데이터 복구 여부를 묻는 다이얼로그
// AI 메모장 프로젝트의 데이터 복구 UI

'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RecoveryDialogProps {
  isOpen: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  tempData?: {
    title: string;
    content: string;
    timestamp: string;
  };
}

export function RecoveryDialog({ 
  isOpen, 
  onRecover, 
  onDiscard, 
  tempData 
}: RecoveryDialogProps) {
  const getTimeAgo = () => {
    if (!tempData?.timestamp) return '';
    
    try {
      const timeAgo = formatDistanceToNow(new Date(tempData.timestamp), { 
        addSuffix: true, 
        locale: ko 
      });
      return timeAgo;
    } catch (error) {
      return '알 수 없는 시간';
    }
  };

  const getPreviewText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-blue-50 p-2">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <AlertDialogTitle className="text-lg">
              임시 저장된 내용이 있습니다
            </AlertDialogTitle>
          </div>
          <div className="space-y-3">
            <div>
              이전에 작성하던 노트가 임시 저장되어 있습니다. 
              복구하시겠습니까?
            </div>
            
            {tempData && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeAgo()} 저장됨</span>
                </div>
                
                {tempData.title && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">제목:</div>
                    <div className="text-sm text-gray-600">
                      {getPreviewText(tempData.title, 50)}
                    </div>
                  </div>
                )}
                
                {tempData.content && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">내용 미리보기:</div>
                    <div className="text-sm text-gray-600">
                      {getPreviewText(tempData.content, 80)}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                복구하지 않으면 임시 저장된 내용이 삭제됩니다.
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onDiscard}>
              삭제
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onRecover} className="bg-blue-600 hover:bg-blue-700">
              복구
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
