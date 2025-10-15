// __tests__/fallback/aiFallback.test.ts
// AI 대체 기능 테스트
// AI 실패 시 대체 기능 제공 검증

import { 
  AIFallbackProvider, 
  getFallbackOptionsForError, 
  generateFallbackSummary, 
  generateFallbackTags,
  fallbackUsageTracker 
} from '@/lib/fallback/aiFallback';
import { AIError } from '@/lib/types/errors';

describe('AI Fallback Provider', () => {
  let fallbackProvider: AIFallbackProvider;

  beforeEach(() => {
    fallbackProvider = new AIFallbackProvider();
  });

  describe('Fallback Options', () => {
    it('should provide default fallback options', () => {
      const options = fallbackProvider.getAllOptions();

      expect(options).toHaveLength(5);
      expect(options.some(opt => opt.id === 'manual_summary')).toBe(true);
      expect(options.some(opt => opt.id === 'manual_tags')).toBe(true);
      expect(options.some(opt => opt.id === 'summary_template')).toBe(true);
      expect(options.some(opt => opt.id === 'tag_suggestions')).toBe(true);
      expect(options.some(opt => opt.id === 'retry_later')).toBe(true);
    });

    it('should provide appropriate options for token errors', () => {
      const tokenError: AIError = {
        code: 'token_limit_exceeded',
        message: 'Token limit exceeded',
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        retryable: false,
      };

      const options = fallbackProvider.getFallbackOptions(tokenError);

      expect(options).toHaveLength(3);
      expect(options.some(opt => opt.type === 'manual_input')).toBe(true);
      expect(options.some(opt => opt.type === 'template')).toBe(true);
      expect(options.some(opt => opt.type === 'suggestion')).toBe(true);
      expect(options.some(opt => opt.type === 'retry')).toBe(false);
    });

    it('should provide appropriate options for API errors', () => {
      const apiError: AIError = {
        code: 'api_key_invalid',
        message: 'API key is invalid',
        category: 'api',
        severity: 'critical',
        timestamp: new Date(),
        retryable: false,
      };

      const options = fallbackProvider.getFallbackOptions(apiError);

      expect(options).toHaveLength(2);
      expect(options.some(opt => opt.type === 'manual_input')).toBe(true);
      expect(options.some(opt => opt.type === 'retry')).toBe(true);
    });

    it('should provide appropriate options for server errors', () => {
      const serverError: AIError = {
        code: 'api_server_error',
        message: 'Server error',
        category: 'server',
        severity: 'critical',
        timestamp: new Date(),
        retryable: true,
        retryAfter: 10000,
      };

      const options = fallbackProvider.getFallbackOptions(serverError);

      expect(options).toHaveLength(2);
      expect(options.some(opt => opt.type === 'manual_input')).toBe(true);
      expect(options.some(opt => opt.type === 'retry')).toBe(true);
    });

    it('should provide appropriate options for network errors', () => {
      const networkError: AIError = {
        code: 'network_connection_failed',
        message: 'Network connection failed',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
        retryAfter: 5000,
      };

      const options = fallbackProvider.getFallbackOptions(networkError);

      expect(options).toHaveLength(2);
      expect(options[0].type).toBe('retry'); // Retry should be first for network errors
      expect(options[1].type).toBe('manual_input');
    });

    it('should provide appropriate options for AI errors', () => {
      const aiError: AIError = {
        code: 'content_filtered',
        message: 'Content filtered',
        category: 'ai',
        severity: 'warning',
        timestamp: new Date(),
        retryable: false,
      };

      const options = fallbackProvider.getFallbackOptions(aiError);

      expect(options).toHaveLength(2);
      expect(options.some(opt => opt.type === 'manual_input')).toBe(true);
      expect(options.some(opt => opt.type === 'template')).toBe(true);
    });

    it('should provide all options for unknown errors', () => {
      const unknownError: AIError = {
        code: 'unknown_error',
        message: 'Unknown error',
        category: 'unknown',
        severity: 'error',
        timestamp: new Date(),
        retryable: true,
      };

      const options = fallbackProvider.getFallbackOptions(unknownError);

      expect(options).toHaveLength(5);
    });
  });

  describe('Summary Template Generation', () => {
    it('should generate template for empty content', () => {
      const template = fallbackProvider.generateSummaryTemplate('');
      expect(template).toBe('• 내용이 없습니다');
    });

    it('should generate template for single line content', () => {
      const content = 'This is a single line of content that is not too long';
      const template = fallbackProvider.generateSummaryTemplate(content);
      
      expect(template).toContain('This is a single line of content that is not too long');
      expect(template.startsWith('•')).toBe(true);
    });

    it('should generate template for multi-line content', () => {
      const content = `First line of content
Second line of content
Third line of content
Fourth line of content`;
      
      const template = fallbackProvider.generateSummaryTemplate(content);
      
      expect(template).toContain('First line of content');
      expect(template).toContain('Fourth line of content');
      expect(template).toContain('2개의 추가 내용');
    });

    it('should truncate long lines', () => {
      const longContent = 'A'.repeat(200);
      const template = fallbackProvider.generateSummaryTemplate(longContent);
      
      expect(template).toContain('A'.repeat(80));
      expect(template).toContain('...');
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n  \n  ';
      const template = fallbackProvider.generateSummaryTemplate(content);
      
      expect(template).toBe('• 내용이 없습니다');
    });
  });

  describe('Tag Suggestions Generation', () => {
    it('should generate suggestions based on keywords', () => {
      const content = '회의에서 할일을 정리하고 프로젝트 계획을 세웠습니다';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      expect(suggestions).toContain('회의');
      expect(suggestions).toContain('할일');
      expect(suggestions).toContain('프로젝트');
      expect(suggestions).toContain('계획');
    });

    it('should generate suggestions for English content', () => {
      const content = 'I had a meeting about the project and created a todo list';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      expect(suggestions).toContain('회의');
      expect(suggestions).toContain('프로젝트');
      expect(suggestions).toContain('할일');
    });

    it('should add length-based tags', () => {
      const shortContent = 'Short content';
      const longContent = 'A'.repeat(2000);
      
      const shortSuggestions = fallbackProvider.generateTagSuggestions(shortContent);
      const longSuggestions = fallbackProvider.generateTagSuggestions(longContent);
      
      expect(shortSuggestions).toContain('짧은글');
      expect(longSuggestions).toContain('긴글');
    });

    it('should add day of week tag', () => {
      const content = 'Some content';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const hasDayName = suggestions.some(suggestion => dayNames.includes(suggestion));
      
      expect(hasDayName).toBe(true);
    });

    it('should limit suggestions to 6 items', () => {
      const content = '회의 할일 프로젝트 학습 기술 디자인 마케팅 고객 제품 분석 계획 리뷰';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      expect(suggestions.length).toBeLessThanOrEqual(6);
    });

    it('should remove duplicate suggestions', () => {
      const content = '회의 회의 미팅 미팅';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      const uniqueSuggestions = [...new Set(suggestions)];
      expect(suggestions.length).toBe(uniqueSuggestions.length);
    });
  });

  describe('Option Management', () => {
    it('should set option availability', () => {
      fallbackProvider.setOptionAvailability('manual_summary', false);
      
      const options = fallbackProvider.getAllOptions();
      const manualSummaryOption = options.find(opt => opt.id === 'manual_summary');
      
      expect(manualSummaryOption?.available).toBe(false);
    });

    it('should add custom options', () => {
      const customOption = {
        name: 'Custom Option',
        description: 'A custom fallback option',
        type: 'manual_input' as const,
        priority: 10,
        available: true,
      };

      const optionId = fallbackProvider.addCustomOption(customOption);
      
      expect(optionId).toBeTruthy();
      expect(typeof optionId).toBe('string');
      
      const options = fallbackProvider.getAllOptions();
      const addedOption = options.find(opt => opt.id === optionId);
      
      expect(addedOption).toBeDefined();
      expect(addedOption?.name).toBe('Custom Option');
    });

    it('should remove options', () => {
      const options = fallbackProvider.getAllOptions();
      const initialCount = options.length;
      
      const removed = fallbackProvider.removeOption('manual_summary');
      
      expect(removed).toBe(true);
      
      const updatedOptions = fallbackProvider.getAllOptions();
      expect(updatedOptions.length).toBe(initialCount - 1);
      expect(updatedOptions.find(opt => opt.id === 'manual_summary')).toBeUndefined();
    });

    it('should return false when removing non-existent option', () => {
      const removed = fallbackProvider.removeOption('non-existent-option');
      
      expect(removed).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('should get fallback options for error', () => {
      const error: AIError = {
        code: 'token_limit_exceeded',
        message: 'Token limit exceeded',
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        retryable: false,
      };

      const options = getFallbackOptionsForError(error);
      
      expect(options).toBeDefined();
      expect(Array.isArray(options)).toBe(true);
    });

    it('should generate fallback summary', () => {
      const content = 'Test content for summary generation';
      const summary = generateFallbackSummary(content);
      
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.startsWith('•')).toBe(true);
    });

    it('should generate fallback tags', () => {
      const content = '회의에서 프로젝트 계획을 세웠습니다';
      const tags = generateFallbackTags(content);
      
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Usage Tracking', () => {
    it('should track fallback usage', () => {
      fallbackUsageTracker.recordUsage('token_limit_exceeded', 'manual_input', true);
      fallbackUsageTracker.recordUsage('network_error', 'retry', false);
      
      const stats = fallbackUsageTracker.getStats();
      
      expect(stats.totalFallbacks).toBe(2);
      expect(stats.byType['manual_input']).toBe(1);
      expect(stats.byType['retry']).toBe(1);
      expect(stats.byErrorCode['token_limit_exceeded']).toBe(1);
      expect(stats.byErrorCode['network_error']).toBe(1);
      expect(stats.successRate).toBe(0.5);
    });

    it('should handle empty usage stats', () => {
      const stats = fallbackUsageTracker.getStats();
      
      expect(stats.totalFallbacks).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content in summary generation', () => {
      const template = fallbackProvider.generateSummaryTemplate('');
      expect(template).toBe('• 내용이 없습니다');
    });

    it('should handle content with only newlines', () => {
      const template = fallbackProvider.generateSummaryTemplate('\n\n\n');
      expect(template).toBe('• 내용이 없습니다');
    });

    it('should handle very long single line content', () => {
      const longContent = 'A'.repeat(10000);
      const template = fallbackProvider.generateSummaryTemplate(longContent);
      
      expect(template.length).toBeLessThan(longContent.length);
      expect(template).toContain('...');
    });

    it('should handle content with special characters', () => {
      const content = '특수문자: !@#$%^&*()_+{}|:"<>?[]\\;\',./';
      const suggestions = fallbackProvider.generateTagSuggestions(content);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
