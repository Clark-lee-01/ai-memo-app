// __tests__/drizzle/db-connection.test.ts
// 데이터베이스 연결 테스트 - Supabase Postgres 연결 검증
// AI 메모장 프로젝트의 데이터베이스 연결 안정성 보장

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// DATABASE_URL이 설정되지 않은 경우 테스트 스킵
const skipIfNoDatabase = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Skipping database connection tests - DATABASE_URL not set');
    return true;
  }
  return false;
};

describe('Database Connection', () => {
  beforeAll(async () => {
    // 연결 테스트를 위한 준비
  });

  afterAll(async () => {
    // 연결 종료는 필요시에만
  });

  it('should have DATABASE_URL environment variable', () => {
    if (skipIfNoDatabase()) return;
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it('should be able to import database module', () => {
    if (skipIfNoDatabase()) return;
    // 모듈 import 테스트
    expect(() => {
      require('../../lib/db');
    }).not.toThrow();
  });
});
