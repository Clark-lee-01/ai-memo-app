// lib/types/database.ts
// 데이터베이스 타입 정의 - Drizzle 스키마에서 추출한 TypeScript 타입
// AI 메모장 프로젝트의 타입 안전성 보장

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { notes, noteTags, summaries, users } from '../../drizzle/schema';

// 기본 타입 정의
export type Note = InferSelectModel<typeof notes>;
export type NewNote = InferInsertModel<typeof notes>;

export type NoteTag = InferSelectModel<typeof noteTags>;
export type NewNoteTag = InferInsertModel<typeof noteTags>;

export type Summary = InferSelectModel<typeof summaries>;
export type NewSummary = InferInsertModel<typeof summaries>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// 관계형 타입 정의
export type NoteWithRelations = Note & {
  tags: NoteTag[];
  summaries: Summary[];
  user: User;
};

export type NoteWithTags = Note & {
  tags: NoteTag[];
};

export type NoteWithSummaries = Note & {
  summaries: Summary[];
};

// CRUD 작업용 타입 정의
export type CreateNoteData = Omit<NewNote, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteData = Partial<Omit<NewNote, 'id' | 'userId' | 'createdAt'>>;

export type CreateNoteTagData = NewNoteTag;
export type CreateSummaryData = Omit<NewSummary, 'createdAt'>;

// 검색 및 필터링용 타입
export type NoteSearchParams = {
  userId: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type NoteListResponse = {
  notes: NoteWithTags[];
  total: number;
  hasMore: boolean;
};
