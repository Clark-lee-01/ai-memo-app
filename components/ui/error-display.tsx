// components/ui/error-display.tsx
// 에러 표시 및 복구 UI 컴포넌트
// AI 처리 에러를 사용자 친화적으로 표시하고 복구 옵션 제공
// 관련 파일: lib/types/errors.ts, lib/utils/errorHandler.ts

'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Shield, 
  Server, 
  Database,
  FileText,
  Settings,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AIError, ErrorSeverity, ErrorCategory } from '@/lib/types/errors';

interface ErrorDisplayProps {
  error: AIError;
  onRetry?: () => void;
  onFallback?: () => void;
  isRetrying?: boolean;
  className?: string;
}

// 에러 심각도별 아이콘 매핑
const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

// 에러 카테고리별 아이콘 매핑
const getCategoryIcon = (category: ErrorCategory) => {
  switch (category) {
    case 'network':
      return <WifiOff className="h-4 w-4" />;
    case 'api':
      return <Server className="h-4 w-4" />;
    case 'token':
      return <Database className="h-4 w-4" />;
    case 'data':
      return <FileText className="h-4 w-4" />;
    case 'system':
      return <Settings className="h-4 w-4" />;
    case 'ai':
      return <Shield className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

// 에러 심각도별 배지 색상
const getSeverityBadgeVariant = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'warning':
      return 'secondary' as const;
    case 'error':
      return 'destructive' as const;
    case 'critical':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
};

// 에러 해결 방법 가이드
const getErrorGuidance = (error: AIError): string[] => {
  const guidance: string[] = [];
  
  switch (error.code) {
    case 'api_key_invalid':
    case 'api_key_expired':
      guidance.push('API 키가 유효하지 않습니다');
      guidance.push('관리자에게 문의하여 API 키를 확인해주세요');
      break;
      
    case 'token_limit_exceeded':
      guidance.push('텍스트가 너무 깁니다');
      guidance.push('내용을 줄여서 다시 시도해주세요');
      guidance.push('또는 수동으로 요약/태그를 작성해주세요');
      break;
      
    case 'rate_limit_exceeded':
      guidance.push('API 호출 한도를 초과했습니다');
      guidance.push('잠시 후 다시 시도해주세요');
      break;
      
    case 'api_timeout':
    case 'network_connection_failed':
      guidance.push('네트워크 연결을 확인해주세요');
      guidance.push('인터넷 연결이 안정적인지 확인해주세요');
      guidance.push('잠시 후 다시 시도해주세요');
      break;
      
    case 'api_server_error':
    case 'model_unavailable':
      guidance.push('AI 서버에 일시적인 문제가 발생했습니다');
      guidance.push('잠시 후 다시 시도해주세요');
      guidance.push('문제가 지속되면 관리자에게 문의해주세요');
      break;
      
    case 'content_filtered':
      guidance.push('내용이 정책에 위배됩니다');
      guidance.push('다른 내용으로 다시 시도해주세요');
      guidance.push('또는 수동으로 요약/태그를 작성해주세요');
      break;
      
    case 'invalid_response_format':
      guidance.push('AI 응답에 문제가 발생했습니다');
      guidance.push('다시 시도해주세요');
      break;
      
    default:
      guidance.push('예상치 못한 오류가 발생했습니다');
      guidance.push('잠시 후 다시 시도해주세요');
      guidance.push('문제가 지속되면 관리자에게 문의해주세요');
  }
  
  return guidance;
};

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onFallback, 
  isRetrying = false,
  className = '' 
}: ErrorDisplayProps) {
  const guidance = getErrorGuidance(error);
  const canRetry = error.retryable && onRetry;
  const canFallback = onFallback;
  
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getSeverityIcon(error.severity)}
          <CardTitle className="text-sm font-medium text-red-800">
            AI 처리 오류
          </CardTitle>
          <Badge variant={getSeverityBadgeVariant(error.severity)} className="text-xs">
            {error.severity === 'warning' ? '경고' : 
             error.severity === 'error' ? '오류' : '심각'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 에러 메시지 */}
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            {getCategoryIcon(error.category)}
            <AlertDescription className="text-sm">
              {error.message}
            </AlertDescription>
          </div>
        </Alert>
        
        {/* 에러 정보 */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">에러 코드:</span>
            <code className="bg-gray-100 px-1 rounded">{error.code}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">카테고리:</span>
            <span className="capitalize">{error.category}</span>
          </div>
          {error.apiEndpoint && (
            <div className="flex items-center gap-2">
              <span className="font-medium">API 엔드포인트:</span>
              <span>{error.apiEndpoint}</span>
            </div>
          )}
          {error.retryCount && error.retryCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium">재시도 횟수:</span>
              <span>{error.retryCount}회</span>
            </div>
          )}
        </div>
        
        {/* 해결 방법 가이드 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <HelpCircle className="h-4 w-4" />
            해결 방법
          </div>
          <ul className="text-xs text-gray-600 space-y-1 ml-6">
            {guidance.map((item, index) => (
              <li key={index} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex gap-2 pt-2">
          {canRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="h-8"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  재시도 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  다시 시도
                </>
              )}
            </Button>
          )}
          
          {canFallback && (
            <Button
              onClick={onFallback}
              size="sm"
              variant="secondary"
              className="h-8"
            >
              <FileText className="h-3 w-3 mr-1" />
              수동 입력
            </Button>
          )}
        </div>
        
        {/* 재시도 대기 시간 표시 */}
        {error.retryAfter && error.retryable && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {Math.ceil(error.retryAfter / 1000)}초 후 자동 재시도 가능
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 간단한 에러 표시 컴포넌트 (인라인용)
export function InlineErrorDisplay({ 
  error, 
  onRetry, 
  isRetrying = false,
  className = '' 
}: Pick<ErrorDisplayProps, 'error' | 'onRetry' | 'isRetrying' | 'className'>) {
  const canRetry = error.retryable && onRetry;
  
  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSeverityIcon(error.severity)}
          <AlertDescription className="text-sm">
            {error.message}
          </AlertDescription>
        </div>
        
        {canRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            size="sm"
            variant="outline"
            className="h-6 text-xs"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                재시도 중
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                재시도
              </>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}
