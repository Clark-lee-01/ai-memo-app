// lib/db.ts
// 데이터베이스 연결 설정 - DrizzleORM과 Supabase Postgres 연결
// AI 메모장 프로젝트의 데이터베이스 접근 계층

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

// 데이터베이스 연결 설정
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// PostgreSQL 클라이언트 생성
const client = postgres(connectionString, {
  prepare: false,
});

// Drizzle 데이터베이스 인스턴스 생성
export const db = drizzle(client, { schema });

// 연결 종료 함수
export const closeConnection = async () => {
  await client.end();
};
