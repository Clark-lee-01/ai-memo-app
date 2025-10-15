// __tests__/monitoring/tokenMonitor.test.ts
// 토큰 모니터링 테스트
// 토큰 사용량 추적 및 제한 관리 검증

import { TokenMonitor, TokenUsageStore } from '@/lib/monitoring/tokenMonitor';
import { AIError } from '@/lib/types/errors';

describe('Token Monitor', () => {
  let tokenMonitor: TokenMonitor;
  let tokenStore: TokenUsageStore;

  beforeEach(() => {
    tokenStore = new TokenUsageStore();
    tokenMonitor = new TokenMonitor(tokenStore);
  });

  describe('Token Usage Recording', () => {
    it('should record token usage correctly', () => {
      const usage = {
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: 'user123',
      };

      tokenMonitor.recordUsage(usage);

      const stats = tokenMonitor.getUsage('user123');
      expect(stats.daily).toBe(1500);
      expect(stats.hourly).toBe(1500);
    });

    it('should track multiple operations separately', () => {
      tokenMonitor.recordUsage({
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: 'user123',
      });

      tokenMonitor.recordUsage({
        input: 800,
        output: 400,
        total: 1200,
        operation: 'generate_tags',
        userId: 'user123',
      });

      const stats = tokenMonitor.getUsage('user123');
      expect(stats.daily).toBe(2700);
      expect(stats.hourly).toBe(2700);
    });

    it('should track usage for different users separately', () => {
      tokenMonitor.recordUsage({
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: 'user123',
      });

      tokenMonitor.recordUsage({
        input: 800,
        output: 400,
        total: 1200,
        operation: 'generate_summary',
        userId: 'user456',
      });

      const user1Stats = tokenMonitor.getUsage('user123');
      const user2Stats = tokenMonitor.getUsage('user456');

      expect(user1Stats.daily).toBe(1500);
      expect(user2Stats.daily).toBe(1200);
    });
  });

  describe('Token Limit Validation', () => {
    it('should allow requests within limits', () => {
      const validation = tokenMonitor.validateRequest(1000, 'user123');

      expect(validation.allowed).toBe(true);
      expect(validation.warnings).toEqual([]);
      expect(validation.error).toBeUndefined();
    });

    it('should reject requests exceeding per-request limit', () => {
      const validation = tokenMonitor.validateRequest(10000, 'user123'); // Exceeds 8k limit

      expect(validation.allowed).toBe(false);
      expect(validation.error).toBeTruthy();
      expect(validation.error?.code).toBe('token_limit_exceeded');
      expect(validation.error?.category).toBe('token');
    });

    it('should warn when approaching daily limit', () => {
      // Set a low daily limit for testing
      tokenMonitor.updateLimits({ daily: 2000 });

      // Record usage close to limit
      tokenMonitor.recordUsage({
        input: 1500,
        output: 500,
        total: 2000,
        operation: 'generate_summary',
        userId: 'user123',
      });

      const validation = tokenMonitor.validateRequest(100, 'user123');

      expect(validation.allowed).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('80%');
    });

    it('should reject requests exceeding daily limit', () => {
      // Set a low daily limit for testing
      tokenMonitor.updateLimits({ daily: 1000 });

      // Record usage at limit
      tokenMonitor.recordUsage({
        input: 1000,
        output: 0,
        total: 1000,
        operation: 'generate_summary',
        userId: 'user123',
      });

      const validation = tokenMonitor.validateRequest(100, 'user123');

      expect(validation.allowed).toBe(false);
      expect(validation.error).toBeTruthy();
      expect(validation.error?.code).toBe('token_limit_exceeded');
    });

    it('should reject requests exceeding hourly limit', () => {
      // Set a low hourly limit for testing
      tokenMonitor.updateLimits({ hourly: 500 });

      // Record usage at limit
      tokenMonitor.recordUsage({
        input: 500,
        output: 0,
        total: 500,
        operation: 'generate_summary',
        userId: 'user123',
      });

      const validation = tokenMonitor.validateRequest(100, 'user123');

      expect(validation.allowed).toBe(false);
      expect(validation.error).toBeTruthy();
      expect(validation.error?.code).toBe('token_limit_exceeded');
    });
  });

  describe('Token Usage Statistics', () => {
    beforeEach(() => {
      // Record some test usage
      tokenMonitor.recordUsage({
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: 'user123',
      });

      tokenMonitor.recordUsage({
        input: 800,
        output: 400,
        total: 1200,
        operation: 'generate_tags',
        userId: 'user123',
      });

      tokenMonitor.recordUsage({
        input: 600,
        output: 300,
        total: 900,
        operation: 'generate_summary',
        userId: 'user456',
      });
    });

    it('should provide correct usage statistics', () => {
      const stats = tokenMonitor.getUsage('user123');

      expect(stats.daily).toBe(2700);
      expect(stats.hourly).toBe(2700);
      expect(stats.limits.daily).toBe(100000);
      expect(stats.limits.hourly).toBe(10000);
      expect(stats.limits.perRequest).toBe(8000);
    });

    it('should provide usage statistics for all users when no userId specified', () => {
      const stats = tokenMonitor.getUsage();

      expect(stats.daily).toBe(3600); // 2700 + 900
      expect(stats.hourly).toBe(3600);
    });

    it('should provide operation breakdown in stats', () => {
      const stats = tokenMonitor.getUsage('user123');

      expect(stats.stats.operations['generate_summary']).toBe(1500);
      expect(stats.stats.operations['generate_tags']).toBe(1200);
    });
  });

  describe('Token Limit Updates', () => {
    it('should update limits correctly', () => {
      const newLimits = {
        daily: 50000,
        hourly: 5000,
        perRequest: 4000,
        warningThreshold: 0.9,
      };

      tokenMonitor.updateLimits(newLimits);

      const usage = tokenMonitor.getUsage();
      expect(usage.limits.daily).toBe(50000);
      expect(usage.limits.hourly).toBe(5000);
      expect(usage.limits.perRequest).toBe(4000);
      expect(usage.limits.warningThreshold).toBe(0.9);
    });

    it('should update only specified limits', () => {
      const originalLimits = tokenMonitor.getUsage().limits;

      tokenMonitor.updateLimits({ daily: 50000 });

      const updatedLimits = tokenMonitor.getUsage().limits;
      expect(updatedLimits.daily).toBe(50000);
      expect(updatedLimits.hourly).toBe(originalLimits.hourly);
      expect(updatedLimits.perRequest).toBe(originalLimits.perRequest);
    });
  });

  describe('Token Usage Reset', () => {
    beforeEach(() => {
      tokenMonitor.recordUsage({
        input: 1000,
        output: 500,
        total: 1500,
        operation: 'generate_summary',
        userId: 'user123',
      });

      tokenMonitor.recordUsage({
        input: 800,
        output: 400,
        total: 1200,
        operation: 'generate_summary',
        userId: 'user456',
      });
    });

    it('should reset usage for specific user', () => {
      expect(tokenMonitor.getUsage('user123').daily).toBe(1500);
      expect(tokenMonitor.getUsage('user456').daily).toBe(1200);

      tokenMonitor.resetUsage('user123');

      expect(tokenMonitor.getUsage('user123').daily).toBe(0);
      expect(tokenMonitor.getUsage('user456').daily).toBe(1200);
    });

    it('should reset usage for all users when no userId specified', () => {
      expect(tokenMonitor.getUsage().daily).toBe(2700);

      tokenMonitor.resetUsage();

      expect(tokenMonitor.getUsage().daily).toBe(0);
      expect(tokenMonitor.getUsage('user123').daily).toBe(0);
      expect(tokenMonitor.getUsage('user456').daily).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero token usage', () => {
      const validation = tokenMonitor.validateRequest(0, 'user123');

      expect(validation.allowed).toBe(true);
      expect(validation.warnings).toEqual([]);
    });

    it('should handle negative token usage gracefully', () => {
      const validation = tokenMonitor.validateRequest(-100, 'user123');

      expect(validation.allowed).toBe(true);
    });

    it('should handle undefined userId', () => {
      const validation = tokenMonitor.validateRequest(1000);

      expect(validation.allowed).toBe(true);
    });

    it('should handle empty string userId', () => {
      const validation = tokenMonitor.validateRequest(1000, '');

      expect(validation.allowed).toBe(true);
    });
  });
});
