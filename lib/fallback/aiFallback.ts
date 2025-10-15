// lib/fallback/aiFallback.ts
// AI 실패 시 대체 기능 제공 메커니즘
// AI 처리 실패 시 수동 입력 옵션과 기본 템플릿 제공
// 관련 파일: lib/types/errors.ts, components/ui/error-display.tsx

import { AIError } from '@/lib/types/errors';

// 대체 기능 타입
export interface FallbackOption {
  id: string;
  name: string;
  description: string;
  type: 'manual_input' | 'template' | 'suggestion' | 'retry';
  priority: number; // 우선순위 (낮을수록 높은 우선순위)
  available: boolean;
  action?: () => void;
}

// 대체 기능 제공자 클래스
export class AIFallbackProvider {
  private fallbackOptions: FallbackOption[] = [];
  
  constructor() {
    this.initializeDefaultOptions();
  }
  
  // 기본 대체 옵션 초기화
  private initializeDefaultOptions(): void {
    this.fallbackOptions = [
      {
        id: 'manual_summary',
        name: '수동 요약 작성',
        description: 'AI 대신 직접 요약을 작성할 수 있습니다',
        type: 'manual_input',
        priority: 1,
        available: true,
      },
      {
        id: 'manual_tags',
        name: '수동 태그 입력',
        description: 'AI 대신 직접 태그를 입력할 수 있습니다',
        type: 'manual_input',
        priority: 2,
        available: true,
      },
      {
        id: 'summary_template',
        name: '요약 템플릿 사용',
        description: '기본 요약 템플릿을 사용할 수 있습니다',
        type: 'template',
        priority: 3,
        available: true,
      },
      {
        id: 'tag_suggestions',
        name: '태그 제안',
        description: '일반적인 태그 목록에서 선택할 수 있습니다',
        type: 'suggestion',
        priority: 4,
        available: true,
      },
      {
        id: 'retry_later',
        name: '나중에 재시도',
        description: '잠시 후 AI 처리를 다시 시도할 수 있습니다',
        type: 'retry',
        priority: 5,
        available: true,
      },
    ];
  }
  
  // 에러에 따른 대체 옵션 제공
  getFallbackOptions(error: AIError): FallbackOption[] {
    const availableOptions = this.fallbackOptions.filter(option => option.available);
    
    // 에러 타입에 따른 필터링
    switch (error.category) {
      case 'token':
        // 토큰 에러의 경우 수동 입력 우선
        return availableOptions
          .filter(option => 
            option.type === 'manual_input' || 
            option.type === 'template' ||
            option.type === 'suggestion'
          )
          .sort((a, b) => a.priority - b.priority);
          
      case 'api':
        // API 에러의 경우 재시도 옵션 포함
        return availableOptions
          .filter(option => 
            option.type === 'manual_input' || 
            option.type === 'retry'
          )
          .sort((a, b) => a.priority - b.priority);
          
      case 'api':
        // 서버 에러의 경우 재시도 옵션 포함
        return availableOptions
          .filter(option => 
            option.type === 'manual_input' || 
            option.type === 'retry'
          )
          .sort((a, b) => a.priority - b.priority);
          
      case 'api':
        // 네트워크 에러의 경우 재시도 우선
        return availableOptions
          .filter(option => 
            option.type === 'retry' || 
            option.type === 'manual_input'
          )
          .sort((a, b) => a.priority - b.priority);
          
      case 'ai':
        // AI 에러의 경우 수동 입력 우선
        return availableOptions
          .filter(option => 
            option.type === 'manual_input' || 
            option.type === 'template'
          )
          .sort((a, b) => a.priority - b.priority);
          
      default:
        // 기타 에러의 경우 모든 옵션 제공
        return availableOptions.sort((a, b) => a.priority - b.priority);
    }
  }
  
  // 요약 템플릿 생성
  generateSummaryTemplate(noteContent: string): string {
    const lines = noteContent.split('\n').filter(line => line.trim().length > 0);
    const wordCount = noteContent.split(/\s+/).length;
    
    if (lines.length === 0) {
      return '• 내용이 없습니다';
    }
    
    if (lines.length === 1) {
      return `• ${lines[0].substring(0, 100)}${lines[0].length > 100 ? '...' : ''}`;
    }
    
    // 첫 번째와 마지막 줄을 요약으로 사용
    const firstLine = lines[0].substring(0, 80);
    const lastLine = lines[lines.length - 1].substring(0, 80);
    
    let template = `• ${firstLine}${lines[0].length > 80 ? '...' : ''}`;
    
    if (lines.length > 2) {
      template += `\n• ${lines.length - 2}개의 추가 내용`;
    }
    
    if (lastLine !== firstLine) {
      template += `\n• ${lastLine}${lines[lines.length - 1].length > 80 ? '...' : ''}`;
    }
    
    return template;
  }
  
  // 태그 제안 생성
  generateTagSuggestions(noteContent: string): string[] {
    const suggestions: string[] = [];
    const content = noteContent.toLowerCase();
    
    // 일반적인 태그 매핑
    const tagMappings = [
      { keywords: ['회의', '미팅', 'meeting'], tag: '회의' },
      { keywords: ['할일', 'todo', 'task', '작업'], tag: '할일' },
      { keywords: ['아이디어', 'idea', '생각'], tag: '아이디어' },
      { keywords: ['학습', 'study', '공부', '교육'], tag: '학습' },
      { keywords: ['프로젝트', 'project', '작업'], tag: '프로젝트' },
      { keywords: ['개인', 'personal', '일상'], tag: '개인' },
      { keywords: ['업무', 'work', '직장'], tag: '업무' },
      { keywords: ['기술', 'tech', '개발', '코딩'], tag: '기술' },
      { keywords: ['디자인', 'design', 'UI', 'UX'], tag: '디자인' },
      { keywords: ['마케팅', 'marketing', '광고'], tag: '마케팅' },
      { keywords: ['고객', 'customer', '클라이언트'], tag: '고객' },
      { keywords: ['제품', 'product', '상품'], tag: '제품' },
      { keywords: ['분석', 'analysis', '데이터'], tag: '분석' },
      { keywords: ['계획', 'plan', '전략'], tag: '계획' },
      { keywords: ['리뷰', 'review', '검토'], tag: '리뷰' },
    ];
    
    // 키워드 매칭으로 태그 제안
    tagMappings.forEach(({ keywords, tag }) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        suggestions.push(tag);
      }
    });
    
    // 내용 길이에 따른 추가 태그
    if (noteContent.length > 1000) {
      suggestions.push('긴글');
    } else if (noteContent.length < 100) {
      suggestions.push('짧은글');
    }
    
    // 날짜 관련 태그
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    suggestions.push(dayNames[dayOfWeek]);
    
    // 중복 제거 및 최대 6개로 제한
    return [...new Set(suggestions)].slice(0, 6);
  }
  
  // 대체 옵션 활성화/비활성화
  setOptionAvailability(id: string, available: boolean): void {
    const option = this.fallbackOptions.find(opt => opt.id === id);
    if (option) {
      option.available = available;
    }
  }
  
  // 사용자 정의 대체 옵션 추가
  addCustomOption(option: Omit<FallbackOption, 'id'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newOption: FallbackOption = {
      ...option,
      id,
    };
    
    this.fallbackOptions.push(newOption);
    return id;
  }
  
  // 대체 옵션 제거
  removeOption(id: string): boolean {
    const index = this.fallbackOptions.findIndex(opt => opt.id === id);
    if (index > -1) {
      this.fallbackOptions.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // 모든 대체 옵션 조회
  getAllOptions(): FallbackOption[] {
    return [...this.fallbackOptions];
  }
}

// 전역 대체 기능 제공자 인스턴스
export const aiFallbackProvider = new AIFallbackProvider();

// 대체 기능 사용을 위한 헬퍼 함수들
export function getFallbackOptionsForError(error: AIError): FallbackOption[] {
  return aiFallbackProvider.getFallbackOptions(error);
}

export function generateFallbackSummary(noteContent: string): string {
  return aiFallbackProvider.generateSummaryTemplate(noteContent);
}

export function generateFallbackTags(noteContent: string): string[] {
  return aiFallbackProvider.generateTagSuggestions(noteContent);
}

// 대체 기능 사용 통계
export interface FallbackUsageStats {
  totalFallbacks: number;
  byType: { [key: string]: number };
  byErrorCode: { [key: string]: number };
  successRate: number;
}

class FallbackUsageTracker {
  private usage: Array<{
    errorCode: string;
    fallbackType: string;
    success: boolean;
    timestamp: Date;
  }> = [];
  
  recordUsage(errorCode: string, fallbackType: string, success: boolean): void {
    this.usage.push({
      errorCode,
      fallbackType,
      success,
      timestamp: new Date(),
    });
    
    // 오래된 기록 정리 (30일 이상)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.usage = this.usage.filter(u => u.timestamp > thirtyDaysAgo);
  }
  
  getStats(): FallbackUsageStats {
    const totalFallbacks = this.usage.length;
    const successfulFallbacks = this.usage.filter(u => u.success).length;
    
    const byType: { [key: string]: number } = {};
    const byErrorCode: { [key: string]: number } = {};
    
    this.usage.forEach(u => {
      byType[u.fallbackType] = (byType[u.fallbackType] || 0) + 1;
      byErrorCode[u.errorCode] = (byErrorCode[u.errorCode] || 0) + 1;
    });
    
    return {
      totalFallbacks,
      byType,
      byErrorCode,
      successRate: totalFallbacks > 0 ? successfulFallbacks / totalFallbacks : 0,
    };
  }
}

export const fallbackUsageTracker = new FallbackUsageTracker();
