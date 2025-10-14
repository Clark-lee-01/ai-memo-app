// components/notes/save-status.tsx
// 저장 상태 표시 컴포넌트 - 자동 저장 상태를 시각적으로 표시
// AI 메모장 프로젝트의 저장 상태 UI

'use client';

import { SaveStatus } from '@/lib/hooks/useAutoSave';
import { Check, AlertCircle, Loader2, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SaveStatusProps {
  status: SaveStatus;
  className?: string;
}

export function SaveStatusComponent({ status, className = '' }: SaveStatusProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'saved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Save className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'saving':
        return '저장 중...';
      case 'saved':
        if (status.lastSaved) {
          const timeAgo = formatDistanceToNow(status.lastSaved, { 
            addSuffix: true, 
            locale: ko 
          });
          return `저장됨 (${timeAgo})`;
        }
        return '저장됨';
      case 'error':
        return status.error || '저장 실패';
      default:
        return '저장되지 않음';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}
