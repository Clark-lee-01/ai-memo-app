// lib/middleware/tokenLimitMiddleware.ts
// 토큰 사용량 제한 미들웨어
// AI 기능 사용 전 토큰 제한을 확인하고 제한하는 미들웨어
// 관련 파일: lib/monitoring/tokenMonitor.ts, lib/ai/gemini.ts

import { NextRequest, NextResponse } from 'next/server';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';
import { AIError } from '@/lib/types/errors';

// 토큰 제한 미들웨어 옵션
interface TokenLimitMiddlewareOptions {
  estimatedTokens: number;
  operation: string;
  userId?: string;
  strictMode?: boolean; // true면 제한 초과 시 에러, false면 경고만
}

// 토큰 제한 미들웨어
export async function tokenLimitMiddleware(
  request: NextRequest,
  options: TokenLimitMiddlewareOptions
): Promise<NextResponse | null> {
  const { estimatedTokens, operation, userId, strictMode = true } = options;

  try {
    // 토큰 제한 확인
    const validation = tokenMonitor.validateRequest(estimatedTokens, userId);
    
    if (!validation.allowed) {
      // 엄격 모드인 경우 에러 반환
      if (strictMode) {
        const error: AIError = {
          code: 'token_limit_exceeded',
          message: validation.error?.message || '토큰 제한을 초과했습니다.',
          category: 'token',
          severity: 'error',
          timestamp: new Date(),
          userId,
          retryable: false,
          tokenUsage: {
            input: estimatedTokens,
            output: 0,
            total: estimatedTokens,
            limit: tokenMonitor.getUsage(userId).limits.daily,
          },
        };
        
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code,
            category: error.category,
            severity: error.severity,
            tokenUsage: error.tokenUsage,
          },
          { status: 429 } // Too Many Requests
        );
      }
      
      // 경고 모드인 경우 경고 헤더 추가
      return NextResponse.json(
        { 
          warning: validation.warnings.join(' '),
          tokenUsage: {
            input: estimatedTokens,
            output: 0,
            total: estimatedTokens,
            limit: tokenMonitor.getUsage(userId).limits.daily,
          },
        },
        { status: 200 }
      );
    }
    
    // 경고가 있는 경우 헤더에 추가
    if (validation.warnings.length > 0) {
      const response = NextResponse.next();
      response.headers.set('X-Token-Warning', validation.warnings.join('; '));
      return response;
    }
    
    // 제한 통과
    return null;
    
  } catch (error) {
    console.error('토큰 제한 미들웨어 오류:', error);
    
    // 에러 발생 시에도 엄격 모드에 따라 처리
    if (strictMode) {
      return NextResponse.json(
        { error: '토큰 제한 확인 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }
    
    return null;
  }
}

// AI 기능 사용 전 토큰 제한 확인
export async function checkTokenLimit(
  estimatedTokens: number,
  operation: string,
  userId?: string
): Promise<{ allowed: boolean; error?: AIError; warnings: string[] }> {
  try {
    const validation = tokenMonitor.validateRequest(estimatedTokens, userId);
    
    if (!validation.allowed) {
      const error: AIError = {
        code: 'token_limit_exceeded',
        message: validation.error?.message || '토큰 제한을 초과했습니다.',
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        userId,
        retryable: false,
        tokenUsage: {
          input: estimatedTokens,
          output: 0,
          total: estimatedTokens,
          limit: tokenMonitor.getUsage(userId).limits.daily,
        },
      };
      
      return {
        allowed: false,
        error,
        warnings: validation.warnings,
      };
    }
    
    return {
      allowed: true,
      warnings: validation.warnings,
    };
    
  } catch (error) {
    console.error('토큰 제한 확인 오류:', error);
    
    const aiError: AIError = {
      code: 'token_limit_check_failed',
      message: '토큰 제한 확인 중 오류가 발생했습니다',
      category: 'system',
      severity: 'error',
      timestamp: new Date(),
      userId,
      retryable: true,
    };
    
    return {
      allowed: false,
      error: aiError,
      warnings: [],
    };
  }
}

// 토큰 사용량 기록
export async function recordTokenUsage(
  input: number,
  output: number,
  operation: string,
  userId?: string
): Promise<void> {
  try {
    tokenMonitor.recordUsage({
      input,
      output,
      total: input + output,
      operation,
      userId,
    });
  } catch (error) {
    console.error('토큰 사용량 기록 오류:', error);
  }
}

// 토큰 제한 상태 조회
export async function getTokenLimitStatus(userId?: string): Promise<{
  canUseAI: boolean;
  dailyUsage: number;
  dailyLimit: number;
  hourlyUsage: number;
  hourlyLimit: number;
  warnings: string[];
  errors: string[];
}> {
  try {
    const usage = tokenMonitor.getUsage(userId);
    const limitCheck = tokenMonitor['store'].checkLimits(userId);
    
    return {
      canUseAI: limitCheck.canProceed,
      dailyUsage: usage.daily,
      dailyLimit: usage.limits.daily,
      hourlyUsage: usage.hourly,
      hourlyLimit: usage.limits.hourly,
      warnings: limitCheck.warnings,
      errors: limitCheck.errors,
    };
  } catch (error) {
    console.error('토큰 제한 상태 조회 오류:', error);
    
    return {
      canUseAI: false,
      dailyUsage: 0,
      dailyLimit: 0,
      hourlyUsage: 0,
      hourlyLimit: 0,
      warnings: [],
      errors: ['토큰 제한 상태를 조회할 수 없습니다'],
    };
  }
}
