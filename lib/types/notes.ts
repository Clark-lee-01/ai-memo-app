// lib/types/notes.ts
// 노트 관련 타입 정의 - 노트 데이터 구조 및 타입 안전성 보장
// AI 메모장 프로젝트의 노트 관리 시스템 타입

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { notes } from '../drizzle/schema';

// 기본 노트 타입 정의
export type Note = InferSelectModel<typeof notes>;
export type NewNote = InferInsertModel<typeof notes>;

// 노트 생성 폼 데이터 타입
export interface NoteFormData {
  title: string;
  content: string;
}

// 노트 생성 폼 에러 타입
export interface NoteFormErrors {
  title?: string;
  content?: string;
  general?: string;
}

// 노트 생성 결과 타입
export interface NoteCreateResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

// 노트 업데이트 데이터 타입
export interface NoteUpdateData {
  title?: string;
  content?: string;
}

// 노트 목록 조회 옵션 타입
export interface NoteListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// 노트 목록 응답 타입
export interface NoteListResponse {
  notes: Note[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
