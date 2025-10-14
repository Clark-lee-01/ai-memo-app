// __mocks__/google-genai.js
// @google/genai 모킹 파일
// Jest 테스트에서 Google Gemini API를 모킹하기 위한 파일

export class GoogleGenAI {
  constructor(options) {
    this.apiKey = options.apiKey;
  }

  getGenerativeModel(options) {
    return {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked response text'
        }
      })
    };
  }
}

export const generateSummary = jest.fn();
export const generateTags = jest.fn();
export const checkAPIStatus = jest.fn();
export const validateTextLength = jest.fn();
export const GeminiAPIError = class extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'GeminiAPIError';
    this.code = code;
    this.statusCode = statusCode;
  }
};
