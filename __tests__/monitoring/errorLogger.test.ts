// __tests__/monitoring/errorLogger.test.ts
// 에러 로깅 테스트
// 에러 로그 기록 및 통계 생성 검증

import { ErrorLogger, ErrorLogStore } from '@/lib/monitoring/errorLogger';
import { AIError } from '@/lib/types/errors';

describe('Error Logger', () => {
  let errorLogger: ErrorLogger;
  let errorStore: ErrorLogStore;

  beforeEach(() => {
    errorStore = new ErrorLogStore();
    errorLogger = new ErrorLogger(errorStore, 'test', '1.0.0');
  });

  describe('Error Logging', () => {
    it('should log errors correctly', () => {
      const error: AIError = {
        code: 'api_key_invalid',
        message: 'API key is invalid',
        category: 'api',
        severity: 'critical',
        timestamp: new Date(),
        userId: 'user123',
        retryable: false,
      };

      const logId = errorLogger.logError(error, {
        userId: 'user123',
        action: 'generate_summary',
        component: 'gemini-api',
      });

      expect(logId).toBeTruthy();
      expect(typeof logId).toBe('string');

      const logs = errorLogger.getLogs({ userId: 'user123' });
      expect(logs).toHaveLength(1);
      expect(logs[0].error.code).toBe('api_key_invalid');
      expect(logs[0].context.userId).toBe('user123');
      expect(logs[0].context.action).toBe('generate_summary');
      expect(logs[0].context.component).toBe('gemini-api');
    });

    it('should include metadata in logs', () => {
      const error: AIError = {
        code: 'network_error',
        message: 'Network connection failed',
        category: 'network',
        severity: 'error',
        timestamp: new Date(),
        userId: 'user123',
        retryable: true,
        retryAfter: 5000,
      };

      const logId = errorLogger.logError(error, {
        userId: 'user123',
        action: 'generate_summary',
        component: 'gemini-api',
      }, {
        sessionId: 'session123',
        requestId: 'req456',
      });

      const logs = errorLogger.getLogs({ userId: 'user123' });
      expect(logs[0].metadata.sessionId).toBe('session123');
      expect(logs[0].metadata.requestId).toBe('req456');
      expect(logs[0].metadata.environment).toBe('test');
      expect(logs[0].metadata.version).toBe('1.0.0');
    });

    it('should handle errors without userId', () => {
      const error: AIError = {
        code: 'server_error',
        message: 'Server error',
        category: 'server',
        severity: 'critical',
        timestamp: new Date(),
        retryable: true,
        retryAfter: 10000,
      };

      const logId = errorLogger.logError(error, {
        action: 'generate_summary',
        component: 'gemini-api',
      });

      expect(logId).toBeTruthy();

      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context.userId).toBeUndefined();
    });
  });

  describe('Error Filtering', () => {
    beforeEach(() => {
      // Create test errors
      const errors = [
        {
          code: 'api_key_invalid',
          category: 'api' as const,
          severity: 'critical' as const,
          userId: 'user123',
        },
        {
          code: 'network_error',
          category: 'network' as const,
          severity: 'error' as const,
          userId: 'user123',
        },
        {
          code: 'token_limit_exceeded',
          category: 'token' as const,
          severity: 'error' as const,
          userId: 'user456',
        },
        {
          code: 'server_error',
          category: 'server' as const,
          severity: 'critical' as const,
          userId: 'user123',
        },
      ];

      errors.forEach((errorData, index) => {
        const error: AIError = {
          ...errorData,
          message: `Test error ${index}`,
          timestamp: new Date(),
          retryable: false,
        };

        errorLogger.logError(error, {
          userId: errorData.userId,
          action: 'test_action',
          component: 'test_component',
        });
      });
    });

    it('should filter by userId', () => {
      const user123Logs = errorLogger.getLogs({ userId: 'user123' });
      const user456Logs = errorLogger.getLogs({ userId: 'user456' });

      expect(user123Logs).toHaveLength(3);
      expect(user456Logs).toHaveLength(1);
    });

    it('should filter by category', () => {
      const apiLogs = errorLogger.getLogs({ category: 'api' });
      const networkLogs = errorLogger.getLogs({ category: 'network' });

      expect(apiLogs).toHaveLength(1);
      expect(networkLogs).toHaveLength(1);
    });

    it('should filter by severity', () => {
      const criticalLogs = errorLogger.getLogs({ severity: 'critical' });
      const errorLogs = errorLogger.getLogs({ severity: 'error' });

      expect(criticalLogs).toHaveLength(2);
      expect(errorLogs).toHaveLength(2);
    });

    it('should filter by code', () => {
      const apiKeyLogs = errorLogger.getLogs({ code: 'api_key_invalid' });
      const networkLogs = errorLogger.getLogs({ code: 'network_error' });

      expect(apiKeyLogs).toHaveLength(1);
      expect(networkLogs).toHaveLength(1);
    });

    it('should filter by component', () => {
      const componentLogs = errorLogger.getLogs({ component: 'test_component' });
      const otherComponentLogs = errorLogger.getLogs({ component: 'other_component' });

      expect(componentLogs).toHaveLength(4);
      expect(otherComponentLogs).toHaveLength(0);
    });

    it('should filter by resolved status', () => {
      const unresolvedLogs = errorLogger.getLogs({ resolved: false });
      const resolvedLogs = errorLogger.getLogs({ resolved: true });

      expect(unresolvedLogs).toHaveLength(4);
      expect(resolvedLogs).toHaveLength(0);
    });

    it('should combine multiple filters', () => {
      const criticalApiLogs = errorLogger.getLogs({ 
        category: 'api', 
        severity: 'critical' 
      });
      const user123ErrorLogs = errorLogger.getLogs({ 
        userId: 'user123', 
        severity: 'error' 
      });

      expect(criticalApiLogs).toHaveLength(1);
      expect(user123ErrorLogs).toHaveLength(1);
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      // Create test errors with different categories and severities
      const errors = [
        { code: 'api_key_invalid', category: 'api', severity: 'critical', userId: 'user123' },
        { code: 'network_error', category: 'network', severity: 'error', userId: 'user123' },
        { code: 'token_limit_exceeded', category: 'token', severity: 'error', userId: 'user456' },
        { code: 'server_error', category: 'server', severity: 'critical', userId: 'user123' },
        { code: 'rate_limit_exceeded', category: 'api', severity: 'warning', userId: 'user456' },
      ];

      errors.forEach((errorData, index) => {
        const error: AIError = {
          ...errorData,
          message: `Test error ${index}`,
          timestamp: new Date(),
          retryable: false,
        };

        errorLogger.logError(error, {
          userId: errorData.userId,
          action: 'test_action',
          component: 'test_component',
        });
      });
    });

    it('should generate correct statistics', () => {
      const stats = errorLogger.getStats();

      expect(stats.total).toBe(5);
      expect(stats.byCategory.api).toBe(2);
      expect(stats.byCategory.network).toBe(1);
      expect(stats.byCategory.token).toBe(1);
      expect(stats.byCategory.server).toBe(1);
      expect(stats.bySeverity.critical).toBe(2);
      expect(stats.bySeverity.error).toBe(2);
      expect(stats.bySeverity.warning).toBe(1);
      expect(stats.byCode['api_key_invalid']).toBe(1);
      expect(stats.byCode['network_error']).toBe(1);
      expect(stats.byUser['user123']).toBe(3);
      expect(stats.byUser['user456']).toBe(2);
      expect(stats.byComponent['test_component']).toBe(5);
    });

    it('should generate statistics for specific time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const recentStats = errorLogger.getStats({
        start: oneHourAgo,
        end: now,
      });

      const olderStats = errorLogger.getStats({
        start: twoHoursAgo,
        end: oneHourAgo,
      });

      expect(recentStats.total).toBe(5); // All errors are recent
      expect(olderStats.total).toBe(0);
    });

    it('should generate hourly and daily trends', () => {
      const stats = errorLogger.getStats();

      expect(stats.trends.hourly).toBeDefined();
      expect(stats.trends.daily).toBeDefined();
      expect(Object.keys(stats.trends.hourly).length).toBeGreaterThan(0);
      expect(Object.keys(stats.trends.daily).length).toBeGreaterThan(0);
    });
  });

  describe('Error Resolution', () => {
    let logId: string;

    beforeEach(() => {
      const error: AIError = {
        code: 'api_key_invalid',
        message: 'API key is invalid',
        category: 'api',
        severity: 'critical',
        timestamp: new Date(),
        userId: 'user123',
        retryable: false,
      };

      logId = errorLogger.logError(error, {
        userId: 'user123',
        action: 'generate_summary',
        component: 'gemini-api',
      });
    });

    it('should resolve errors correctly', () => {
      const resolved = errorLogger.resolveError(logId, 'admin123');

      expect(resolved).toBe(true);

      const logs = errorLogger.getLogs({ userId: 'user123' });
      const resolvedLog = logs.find(log => log.id === logId);

      expect(resolvedLog?.resolved).toBe(true);
      expect(resolvedLog?.resolvedAt).toBeDefined();
      expect(resolvedLog?.resolvedBy).toBe('admin123');
    });

    it('should return false for non-existent log ID', () => {
      const resolved = errorLogger.resolveError('non-existent-id', 'admin123');

      expect(resolved).toBe(false);
    });

    it('should filter resolved errors correctly', () => {
      errorLogger.resolveError(logId, 'admin123');

      const resolvedLogs = errorLogger.getLogs({ resolved: true });
      const unresolvedLogs = errorLogger.getLogs({ resolved: false });

      expect(resolvedLogs).toHaveLength(1);
      expect(unresolvedLogs).toHaveLength(0);
    });
  });

  describe('Error Alerts', () => {
    it('should add alerts correctly', () => {
      const alertId = errorLogger.addAlert({
        name: 'Test Alert',
        conditions: {
          category: ['api'],
          severity: ['critical'],
        },
        channels: ['email'],
        recipients: ['admin@example.com'],
        enabled: true,
      });

      expect(alertId).toBeTruthy();
      expect(typeof alertId).toBe('string');
    });

    it('should setup critical error alerts', () => {
      errorLogger.setupCriticalErrorAlerts();

      // This should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error logs', () => {
      const logs = errorLogger.getLogs();
      const stats = errorLogger.getStats();

      expect(logs).toHaveLength(0);
      expect(stats.total).toBe(0);
    });

    it('should handle invalid filter parameters', () => {
      const logs = errorLogger.getLogs({
        userId: 'non-existent-user',
        category: 'non-existent-category',
        severity: 'non-existent-severity',
      });

      expect(logs).toHaveLength(0);
    });

    it('should handle missing context parameters', () => {
      const error: AIError = {
        code: 'test_error',
        message: 'Test error',
        category: 'unknown',
        severity: 'error',
        timestamp: new Date(),
        retryable: false,
      };

      const logId = errorLogger.logError(error, {});

      expect(logId).toBeTruthy();

      const logs = errorLogger.getLogs();
      expect(logs[0].context.userId).toBeUndefined();
      expect(logs[0].context.action).toBeUndefined();
      expect(logs[0].context.component).toBeUndefined();
    });
  });
});
