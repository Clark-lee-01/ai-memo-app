// lib/ai/gemini.ts
// Google Gemini API 클라이언트 구현
// AI 기반 요약 및 태깅 기능을 위한 Gemini API 연동
// 관련 파일: app/actions/notes.ts, lib/types/notes.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyAIError, createErrorContext } from '@/lib/utils/errorHandler';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';
import { logAIError } from '@/lib/monitoring/errorLogger';
import { AIError } from '@/lib/types/errors';

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 토큰 제한 상수 (8k 토큰)
const MAX_TOKENS = 8000;

// 토큰 길이 추정 함수 (대략적인 계산)
function estimateTokenLength(text: string): number {
  // 한국어와 영어를 고려한 대략적인 토큰 계산
  // 1 토큰 ≈ 4자 (한국어), 1 토큰 ≈ 3.5자 (영어)
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const englishChars = text.length - koreanChars;
  return Math.ceil((koreanChars / 4) + (englishChars / 3.5));
}

// 텍스트 길이 검증 함수
export function validateTextLength(text: string): { isValid: boolean; tokenCount: number; error?: string } {
  const tokenCount = estimateTokenLength(text);
  
  if (tokenCount > MAX_TOKENS) {
    return {
      isValid: false,
      tokenCount,
      error: `텍스트가 너무 깁니다. 현재 ${tokenCount} 토큰 (최대 ${MAX_TOKENS} 토큰)`
    };
  }
  
  return {
    isValid: true,
    tokenCount
  };
}

// Gemini API 에러 타입 정의
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

// 재시도 로직을 포함한 API 호출 함수
async function callGeminiWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  userId?: string,
  operationType: string = 'api_call'
): Promise<T> {
  let lastError: Error;
  let lastAIError: AIError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // 성공 시 토큰 사용량 기록 (실제 사용량이 있다면)
      if (result && typeof result === 'object' && 'tokenUsage' in result) {
        const tokenUsage = (result as { tokenUsage: { inputTokens: number; outputTokens: number } }).tokenUsage;
        tokenMonitor.recordUsage({
          input: tokenUsage.inputTokens,
          output: tokenUsage.outputTokens,
          total: tokenUsage.inputTokens + tokenUsage.outputTokens,
          operation: operationType,
          userId,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // AI 에러로 분류
      const context = createErrorContext(userId, operationType, 'gemini-api');
      const aiError = classifyAIError(error as { name?: string; code?: string; message?: string; status?: number }, context);
      
      if (aiError) {
        lastAIError = aiError;
        
        // 에러 로깅
        logAIError(aiError, {
          userId,
          action: operationType,
          component: 'gemini-api',
        });
        
        // 재시도할 수 없는 에러인 경우
        if (!aiError.retryable || attempt === maxRetries) {
          break;
        }
        
        // 재시도 대기 시간 계산
        const waitTime = aiError.retryAfter || delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // 일반 에러 처리
        if (attempt === maxRetries || isNonRetryableError(error as { statusCode?: number; message?: string })) {
          break;
        }
        
        // 지수 백오프로 대기
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // 최종 에러 생성
  if (lastAIError) {
    throw lastAIError;
  }
  
  throw new GeminiAPIError(
    `API 호출이 ${maxRetries}번 시도 후 실패했습니다: ${lastError!.message}`,
    'MAX_RETRIES_EXCEEDED'
  );
}

// 재시도할 수 없는 에러인지 확인
function isNonRetryableError(error: { statusCode?: number; message?: string }): boolean {
  // 4xx 에러는 재시도하지 않음 (클라이언트 에러)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return true;
  }
  
  // API 키 관련 에러는 재시도하지 않음
  if (error.message?.includes('API key') || error.message?.includes('authentication')) {
    return true;
  }
  
  return false;
}

// 기본 API 호출 함수
export async function generateContent(
  prompt: string, 
  userId?: string,
  operationType: string = 'generate_content'
): Promise<string> {
  // 토큰 길이 검증
  const validation = validateTextLength(prompt);
  if (!validation.isValid) {
    const context = createErrorContext(userId, operationType, 'gemini-api');
    const aiError = classifyAIError(
      new Error(validation.error!), 
      context
    );
    if (aiError) {
      logAIError(aiError, { userId, action: operationType, component: 'gemini-api' });
      throw aiError;
    }
    throw new GeminiAPIError(validation.error!, 'TOKEN_LIMIT_EXCEEDED');
  }
  
  // 토큰 사용량 사전 검증
  const tokenValidation = tokenMonitor.validateRequest(validation.tokenCount, userId);
  if (!tokenValidation.allowed) {
    if (tokenValidation.error) {
      logAIError(tokenValidation.error, { userId, action: operationType, component: 'gemini-api' });
      throw tokenValidation.error;
    }
  }
  
  return callGeminiWithRetry(async () => {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 1000, // 출력 토큰 제한
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response.text()) {
      throw new GeminiAPIError('API 응답이 비어있습니다', 'EMPTY_RESPONSE');
    }
    
    const text = response.text();
    
    // 토큰 사용량 기록
    const estimatedOutputTokens = Math.ceil(text.length / 3.5); // 대략적인 출력 토큰 계산
    tokenMonitor.recordUsage({
      input: validation.tokenCount,
      output: estimatedOutputTokens,
      total: validation.tokenCount + estimatedOutputTokens,
      operation: operationType,
      userId,
    });
    
    return text;
  }, 3, 1000, userId, operationType);
}

// 노트 요약 생성 함수
export async function generateSummary(
  noteContent: string, 
  userId?: string
): Promise<string> {
  const prompt = `다음 노트 내용을 3-6개의 불릿 포인트로 요약해주세요. 각 포인트는 간결하고 핵심적인 내용을 담아야 합니다:

${noteContent}

요약:`;

  return generateContent(prompt, userId, 'generate_summary');
}

// 노트 태그 생성 함수
export async function generateTags(
  noteContent: string, 
  userId?: string
): Promise<string[]> {
  const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요. 태그는 쉼표로 구분하여 나열해주세요:

${noteContent}

태그:`;

  const response = await generateContent(prompt, userId, 'generate_tags');
  
  // 응답에서 태그 추출 및 정리
  const tags = response
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 6); // 최대 6개로 제한
  
  return tags;
}

// API 상태 확인 함수
export async function checkAPIStatus(userId?: string): Promise<{ 
  status: 'healthy' | 'error'; 
  message: string;
  tokenUsage?: {
    daily: number;
    hourly: number;
    limits: { daily: number; monthly: number };
  };
}> {
  try {
    await generateContent('안녕하세요', userId, 'api_status_check');
    
    // 토큰 사용량 정보 포함
    const usage = tokenMonitor.getUsage(userId);
    
    return {
      status: 'healthy',
      message: 'Gemini API가 정상적으로 작동합니다',
      tokenUsage: {
        daily: usage.daily,
        hourly: usage.hourly,
        limits: {
          ...usage.limits,
          monthly: usage.limits.daily * 30, // 월간 제한을 일간 제한의 30배로 설정
        },
      },
    };
  } catch (error) {
    // 에러 로깅
    const context = createErrorContext(userId, 'api_status_check', 'gemini-api');
    const aiError = classifyAIError(error as { name?: string; code?: string; message?: string; status?: number }, context);
    if (aiError) {
      logAIError(aiError, { userId, action: 'api_status_check', component: 'gemini-api' });
    }
    
    return {
      status: 'error',
      message: `Gemini API 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}
