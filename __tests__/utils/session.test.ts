// __tests__/utils/session.test.ts
// 세션 유틸리티 테스트 - 세션 정보 추출 및 관리 테스트
// AI 메모장 프로젝트의 세션 유틸리티 테스트

import { 
  extractSessionInfo, 
  isSessionExpiringSoon, 
  clearSessionData, 
  formatTimeUntilExpiry 
} from '@/lib/utils/session';
import { Session } from '@supabase/supabase-js';

describe('Session Utilities', () => {
  describe('extractSessionInfo', () => {
    it('should return expired session info when session is null', () => {
      const result = extractSessionInfo(null);
      
      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isExpired: true,
        timeUntilExpiry: null,
      });
    });

    it('should extract session info from valid session', () => {
      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1시간 후
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as any,
      };

      const result = extractSessionInfo(mockSession);
      
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(result.isExpired).toBe(false);
      expect(result.timeUntilExpiry).toBeGreaterThan(0);
    });

    it('should handle expired session', () => {
      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1시간 전
        expires_in: 3600,
        token_type: 'bearer',
        user: {} as any,
      };

      const result = extractSessionInfo(mockSession);
      
      expect(result.isExpired).toBe(true);
      expect(result.timeUntilExpiry).toBe(0);
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return true when session is expiring soon', () => {
      const sessionInfo = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 2 * 60 * 1000, // 2분 후
        isExpired: false,
        timeUntilExpiry: 2 * 60 * 1000,
      };

      expect(isSessionExpiringSoon(sessionInfo, 5)).toBe(true);
    });

    it('should return false when session has enough time left', () => {
      const sessionInfo = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 10 * 60 * 1000, // 10분 후
        isExpired: false,
        timeUntilExpiry: 10 * 60 * 1000,
      };

      expect(isSessionExpiringSoon(sessionInfo, 5)).toBe(false);
    });

    it('should return true when timeUntilExpiry is null', () => {
      const sessionInfo = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: null,
        isExpired: false,
        timeUntilExpiry: null,
      };

      expect(isSessionExpiringSoon(sessionInfo, 5)).toBe(true);
    });
  });

  describe('clearSessionData', () => {
    beforeEach(() => {
      // localStorage 모킹
      Object.defineProperty(window, 'localStorage', {
        value: {
          removeItem: jest.fn(),
        },
        writable: true,
      });
    });

    it('should clear session data from localStorage', () => {
      clearSessionData();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('supabase.auth.refresh_token');
    });
  });

  describe('formatTimeUntilExpiry', () => {
    it('should format time with minutes and seconds', () => {
      const timeUntilExpiry = 5 * 60 * 1000 + 30 * 1000; // 5분 30초
      const result = formatTimeUntilExpiry(timeUntilExpiry);
      
      expect(result).toBe('5분 30초');
    });

    it('should format time with only seconds when less than a minute', () => {
      const timeUntilExpiry = 45 * 1000; // 45초
      const result = formatTimeUntilExpiry(timeUntilExpiry);
      
      expect(result).toBe('45초');
    });

    it('should return expired message when timeUntilExpiry is null', () => {
      const result = formatTimeUntilExpiry(null);
      
      expect(result).toBe('만료됨');
    });
  });
});
