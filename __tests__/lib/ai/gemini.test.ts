// __tests__/lib/ai/gemini.test.ts
// Gemini API 클라이언트 테스트
// API 호출, 토큰 제한, 에러 처리 기능 검증
// 관련 파일: lib/ai/gemini.ts

import {
  validateTextLength,
  generateContent,
  generateSummary,
  generateTags,
  checkAPIStatus,
  GeminiAPIError
} from '../../../lib/ai/gemini';

// @google/genai 모킹
const mockGenerateContent = jest.fn();
const mockResponse = {
  text: jest.fn(() => 'Mocked response text')
};

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: mockGenerateContent
    }))
  }))
}));

describe('Gemini API Client', () => {
  // 환경변수 설정
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    mockGenerateContent.mockResolvedValue({
      response: mockResponse
    });
  });

  afterAll(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('validateTextLength', () => {
    it('should validate text length correctly for Korean text', () => {
      const koreanText = '안녕하세요'.repeat(1000); // 약 5000자
      const result = validateTextLength(koreanText);
      
      expect(result.isValid).toBe(true);
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('should validate text length correctly for English text', () => {
      const englishText = 'Hello world'.repeat(1000); // 약 11000자
      const result = validateTextLength(englishText);
      
      expect(result.isValid).toBe(true);
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('should reject text that exceeds token limit', () => {
      const longText = 'Very long text'.repeat(10000); // 매우 긴 텍스트
      const result = validateTextLength(longText);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('텍스트가 너무 깁니다');
    });

    it('should handle empty text', () => {
      const result = validateTextLength('');
      
      expect(result.isValid).toBe(true);
      expect(result.tokenCount).toBe(0);
    });
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const prompt = '안녕하세요';
      const result = await generateContent(prompt);
      
      expect(result).toBe('Mocked response text');
    });

    it('should throw error for text exceeding token limit', async () => {
      const longPrompt = 'Very long text'.repeat(10000);
      
      await expect(generateContent(longPrompt)).rejects.toThrow(GeminiAPIError);
    });

    it('should handle API errors gracefully', async () => {
      // 모킹된 함수가 연속으로 에러를 던지도록 설정 (재시도 로직 고려)
      mockGenerateContent
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(generateContent('test')).rejects.toThrow(GeminiAPIError);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for note content', async () => {
      const noteContent = '오늘은 좋은 하루였다. 회의에서 중요한 결정을 내렸고, 팀원들과 즐거운 시간을 보냈다.';
      const result = await generateSummary(noteContent);
      
      expect(result).toBe('Mocked response text');
    });

    it('should handle empty note content', async () => {
      const result = await generateSummary('');
      
      expect(result).toBe('Mocked response text');
    });
  });

  describe('generateTags', () => {
    it('should generate tags from note content', async () => {
      const noteContent = '오늘 회의에서 프로젝트 계획을 논의했다. 다음 주까지 완료해야 할 작업들이 많다.';
      const result = await generateTags(noteContent);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should handle empty note content', async () => {
      const result = await generateTags('');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit tags to maximum 6', async () => {
      // 모킹된 응답이 6개 이상의 태그를 반환하도록 설정
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8'
        }
      });

      const result = await generateTags('test content');
      
      expect(result.length).toBe(6);
    });
  });

  describe('checkAPIStatus', () => {
    it('should return healthy status when API is working', async () => {
      const result = await checkAPIStatus();
      
      expect(result.status).toBe('healthy');
      expect(result.message).toContain('정상적으로 작동');
    });

    it('should return error status when API fails', async () => {
      // 모킹된 함수가 연속으로 에러를 던지도록 설정 (재시도 로직 고려)
      mockGenerateContent
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await checkAPIStatus();
      
      expect(result.status).toBe('error');
      expect(result.message).toContain('오류');
    });
  });

  describe('GeminiAPIError', () => {
    it('should create error with message', () => {
      const error = new GeminiAPIError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GeminiAPIError');
    });

    it('should create error with code and status code', () => {
      const error = new GeminiAPIError('Test error', 'TEST_CODE', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow for note processing', async () => {
      const noteContent = '오늘 회의에서 새로운 프로젝트에 대해 논의했다. 팀원들과 함께 아이디어를 나누고 계획을 세웠다.';
      
      // 토큰 길이 검증
      const validation = validateTextLength(noteContent);
      expect(validation.isValid).toBe(true);
      
      // 요약 생성
      const summary = await generateSummary(noteContent);
      expect(typeof summary).toBe('string');
      
      // 태그 생성
      const tags = await generateTags(noteContent);
      expect(Array.isArray(tags)).toBe(true);
      
      // API 상태 확인
      const status = await checkAPIStatus();
      expect(['healthy', 'error']).toContain(status.status);
    });
  });
});
