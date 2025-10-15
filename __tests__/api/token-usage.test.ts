// __tests__/api/token-usage.test.ts
// 토큰 사용량 API 테스트
// 사용량 조회, 기록, 제한 확인 기능 테스트
// 관련 파일: app/api/token-usage/route.ts, app/api/token-usage/check/route.ts

import { NextRequest } from 'next/server';
import { GET as getTokenUsage, POST as postTokenUsage, PUT as putTokenUsage } from '@/app/api/token-usage/route';
import { POST as checkTokenUsage } from '@/app/api/token-usage/check/route';

// Supabase 모킹
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

// TokenMonitor 모킹
jest.mock('@/lib/monitoring/tokenMonitor', () => ({
  tokenMonitor: {
    getUsage: jest.fn(),
    recordUsage: jest.fn(),
    updateLimits: jest.fn(),
    validateRequest: jest.fn(),
  },
}));

import { createServerClient } from '@/lib/supabase/server';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;
const mockTokenMonitor = tokenMonitor as jest.Mocked<typeof tokenMonitor>;

describe('Token Usage API', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockUsageData = {
    daily: 50000,
    hourly: 5000,
    limits: {
      daily: 100000,
      hourly: 10000,
      perRequest: 8000,
      warningThreshold: 0.8,
    },
    stats: {
      totalUsage: 350000,
      averageDaily: 50000,
      peakHourly: 8000,
      operations: {
        'generate_summary': 200000,
        'generate_tags': 150000,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 Supabase 모킹
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any);
  });

  describe('GET /api/token-usage', () => {
    it('인증된 사용자의 사용량 데이터를 반환한다', async () => {
      mockTokenMonitor.getUsage.mockReturnValue(mockUsageData);
      
      const request = new NextRequest('http://localhost:3000/api/token-usage');
      const response = await getTokenUsage(request);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockUsageData);
      expect(mockTokenMonitor.getUsage).toHaveBeenCalledWith(mockUser.id);
    });

    it('인증되지 않은 사용자에게 401을 반환한다', async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      } as any);
      
      const request = new NextRequest('http://localhost:3000/api/token-usage');
      const response = await getTokenUsage(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: '인증이 필요합니다' });
    });

    it('에러 발생 시 500을 반환한다', async () => {
      mockTokenMonitor.getUsage.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const request = new NextRequest('http://localhost:3000/api/token-usage');
      const response = await getTokenUsage(request);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: '토큰 사용량을 조회할 수 없습니다' });
    });
  });

  describe('POST /api/token-usage', () => {
    it('유효한 사용량 데이터를 기록한다', async () => {
      const requestBody = {
        input: 1000,
        output: 500,
        operation: 'generate_summary',
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await postTokenUsage(request);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mockTokenMonitor.recordUsage).toHaveBeenCalledWith({
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: mockUser.id,
      });
    });

    it('잘못된 요청 데이터에 400을 반환한다', async () => {
      const requestBody = {
        input: 'invalid',
        output: 500,
        operation: 'generate_summary',
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await postTokenUsage(request);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: '잘못된 요청 데이터입니다' });
    });

    it('에러 발생 시 500을 반환한다', async () => {
      mockTokenMonitor.recordUsage.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const requestBody = {
        input: 1000,
        output: 500,
        operation: 'generate_summary',
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await postTokenUsage(request);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: '토큰 사용량을 기록할 수 없습니다' });
    });
  });

  describe('PUT /api/token-usage', () => {
    it('유효한 제한 설정을 업데이트한다', async () => {
      const requestBody = {
        daily: 150000,
        hourly: 15000,
        perRequest: 10000,
        warningThreshold: 0.9,
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await putTokenUsage(request);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mockTokenMonitor.updateLimits).toHaveBeenCalledWith(requestBody);
    });

    it('잘못된 제한 설정에 400을 반환한다', async () => {
      const requestBody = {
        daily: 'invalid',
        hourly: 15000,
        perRequest: 10000,
        warningThreshold: 0.9,
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await putTokenUsage(request);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: '잘못된 요청 데이터입니다' });
    });
  });

  describe('POST /api/token-usage/check', () => {
    it('토큰 제한을 통과하면 허용을 반환한다', async () => {
      mockTokenMonitor.validateRequest.mockReturnValue({
        allowed: true,
        warnings: [],
      });
      
      const requestBody = {
        estimatedTokens: 1000,
        operation: 'generate_summary',
        userId: mockUser.id,
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage/check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await checkTokenUsage(request);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        allowed: true,
        warnings: [],
      });
    });

    it('토큰 제한을 초과하면 거부를 반환한다', async () => {
      const mockError = {
        code: 'token_limit_exceeded',
        message: '일일 토큰 사용량이 초과되었습니다',
        category: 'token',
        severity: 'error',
        timestamp: new Date(),
        userId: mockUser.id,
        retryable: false,
        tokenUsage: {
          input: 1000,
          output: 0,
          total: 1000,
          limit: 100000,
        },
      };
      
      mockTokenMonitor.validateRequest.mockReturnValue({
        allowed: false,
        error: mockError,
        warnings: [],
      });
      
      const requestBody = {
        estimatedTokens: 1000,
        operation: 'generate_summary',
        userId: mockUser.id,
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage/check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await checkTokenUsage(request);
      
      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({
        allowed: false,
        error: mockError.message,
        code: mockError.code,
        category: mockError.category,
        severity: mockError.severity,
        tokenUsage: mockError.tokenUsage,
        warnings: [],
      });
    });

    it('잘못된 요청 데이터에 400을 반환한다', async () => {
      const requestBody = {
        estimatedTokens: 'invalid',
        operation: 'generate_summary',
        userId: mockUser.id,
      };
      
      const request = new NextRequest('http://localhost:3000/api/token-usage/check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await checkTokenUsage(request);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: '잘못된 요청 데이터입니다' });
    });
  });
});
