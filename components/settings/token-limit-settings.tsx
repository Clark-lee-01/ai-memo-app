// components/settings/token-limit-settings.tsx
// 토큰 사용량 한도 설정 컴포넌트
// 사용자가 토큰 사용량 제한을 설정할 수 있는 인터페이스
// 관련 파일: lib/monitoring/tokenMonitor.ts, components/ui/form.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// 토큰 제한 설정 인터페이스
interface TokenLimits {
  daily: number;
  hourly: number;
  perRequest: number;
  warningThreshold: number;
}

// 기본 설정값
const DEFAULT_LIMITS: TokenLimits = {
  daily: 100000,
  hourly: 10000,
  perRequest: 8000,
  warningThreshold: 0.8,
};

// 토큰 제한 설정 컴포넌트
export default function TokenLimitSettings({ userId }: { userId?: string }) {
  const [limits, setLimits] = useState<TokenLimits>(DEFAULT_LIMITS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 설정 로드
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/token-usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('설정을 불러올 수 없습니다');
      }

      const data = await response.json();
      setLimits(data.limits);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/token-usage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limits),
      });

      if (!response.ok) {
        throw new Error('설정을 저장할 수 없습니다');
      }

      setSuccess('설정이 성공적으로 저장되었습니다');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 설정 초기화
  const resetSettings = () => {
    setLimits(DEFAULT_LIMITS);
    setError(null);
    setSuccess(null);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field: keyof TokenLimits, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setLimits(prev => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  // 경고 임계값 변경 핸들러 (0-1 범위)
  const handleThresholdChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setLimits(prev => ({
        ...prev,
        warningThreshold: numValue,
      }));
    }
  };

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, [userId]);

  // 입력값 검증
  const validateInputs = (): string[] => {
    const errors: string[] = [];
    
    if (limits.daily <= 0) {
      errors.push('일일 토큰 제한은 0보다 커야 합니다');
    }
    
    if (limits.hourly <= 0) {
      errors.push('시간당 토큰 제한은 0보다 커야 합니다');
    }
    
    if (limits.perRequest <= 0) {
      errors.push('요청당 토큰 제한은 0보다 커야 합니다');
    }
    
    if (limits.warningThreshold < 0 || limits.warningThreshold > 1) {
      errors.push('경고 임계값은 0과 1 사이여야 합니다');
    }
    
    if (limits.hourly > limits.daily) {
      errors.push('시간당 제한은 일일 제한보다 작아야 합니다');
    }
    
    if (limits.perRequest > limits.hourly) {
      errors.push('요청당 제한은 시간당 제한보다 작아야 합니다');
    }
    
    return errors;
  };

  const validationErrors = validateInputs();
  const isFormValid = validationErrors.length === 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">토큰 사용량 제한 설정</h2>
          <p className="text-muted-foreground">
            AI 기능 사용량 제한을 설정하여 비용을 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            새로고침
          </Button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 성공 메시지 */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* 설정 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            토큰 제한 설정
          </CardTitle>
          <CardDescription>
            AI 기능 사용량을 제한하여 비용을 관리하고 서비스 안정성을 유지하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 일일 토큰 제한 */}
          <div className="space-y-2">
            <Label htmlFor="daily-limit">일일 토큰 제한</Label>
            <Input
              id="daily-limit"
              type="number"
              value={limits.daily}
              onChange={(e) => handleInputChange('daily', e.target.value)}
              placeholder="100000"
              min="1"
              max="1000000"
            />
            <p className="text-sm text-muted-foreground">
              하루 동안 사용할 수 있는 최대 토큰 수
            </p>
          </div>

          {/* 시간당 토큰 제한 */}
          <div className="space-y-2">
            <Label htmlFor="hourly-limit">시간당 토큰 제한</Label>
            <Input
              id="hourly-limit"
              type="number"
              value={limits.hourly}
              onChange={(e) => handleInputChange('hourly', e.target.value)}
              placeholder="10000"
              min="1"
              max="100000"
            />
            <p className="text-sm text-muted-foreground">
              한 시간 동안 사용할 수 있는 최대 토큰 수
            </p>
          </div>

          {/* 요청당 토큰 제한 */}
          <div className="space-y-2">
            <Label htmlFor="per-request-limit">요청당 토큰 제한</Label>
            <Input
              id="per-request-limit"
              type="number"
              value={limits.perRequest}
              onChange={(e) => handleInputChange('perRequest', e.target.value)}
              placeholder="8000"
              min="1"
              max="10000"
            />
            <p className="text-sm text-muted-foreground">
              한 번의 요청에서 사용할 수 있는 최대 토큰 수
            </p>
          </div>

          {/* 경고 임계값 */}
          <div className="space-y-2">
            <Label htmlFor="warning-threshold">경고 임계값</Label>
            <Input
              id="warning-threshold"
              type="number"
              value={limits.warningThreshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              placeholder="0.8"
              min="0"
              max="1"
              step="0.1"
            />
            <p className="text-sm text-muted-foreground">
              사용량이 이 비율에 도달하면 경고를 표시합니다 (0.0 - 1.0)
            </p>
          </div>

          {/* 검증 에러 */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={!isFormValid || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetSettings}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 도움말 */}
      <Card>
        <CardHeader>
          <CardTitle>설정 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">일일 토큰 제한</h4>
            <p className="text-sm text-muted-foreground">
              하루 동안 사용할 수 있는 최대 토큰 수입니다. 이 제한을 초과하면 AI 기능이 비활성화됩니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">시간당 토큰 제한</h4>
            <p className="text-sm text-muted-foreground">
              한 시간 동안 사용할 수 있는 최대 토큰 수입니다. 급격한 사용량 증가를 방지합니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">요청당 토큰 제한</h4>
            <p className="text-sm text-muted-foreground">
              한 번의 요청에서 사용할 수 있는 최대 토큰 수입니다. 긴 텍스트 처리를 제한합니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">경고 임계값</h4>
            <p className="text-sm text-muted-foreground">
              사용량이 이 비율에 도달하면 경고를 표시합니다. 예: 0.8은 80% 사용 시 경고
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
