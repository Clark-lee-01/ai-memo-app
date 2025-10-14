// lib/validations/notes.ts
// 노트 유효성 검사 스키마 - 입력 데이터 검증 및 타입 안전성 보장
// AI 메모장 프로젝트의 노트 데이터 검증

import { z } from 'zod';

// 노트 생성 폼 유효성 검사 스키마
export const noteFormSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자를 초과할 수 없습니다')
    .trim(),
  content: z
    .string()
    .max(10000, '본문은 10,000자를 초과할 수 없습니다')
    .optional()
    .default(''),
});

// 노트 업데이트 유효성 검사 스키마
export const noteUpdateSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자를 초과할 수 없습니다')
    .trim()
    .optional(),
  content: z
    .string()
    .max(10000, '본문은 10,000자를 초과할 수 없습니다')
    .optional(),
});

// 노트 ID 유효성 검사 스키마
export const noteIdSchema = z.string().uuid('유효하지 않은 노트 ID입니다');

// 노트 목록 조회 옵션 유효성 검사 스키마
export const noteListOptionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});

// 타입 추출
export type NoteFormData = z.infer<typeof noteFormSchema>;
export type NoteUpdateData = z.infer<typeof noteUpdateSchema>;
export type NoteListOptions = z.infer<typeof noteListOptionsSchema>;

// 유효성 검사 헬퍼 함수
export function validateNoteForm(data: unknown) {
  return noteFormSchema.safeParse(data);
}

export function validateNoteUpdate(data: unknown) {
  return noteUpdateSchema.safeParse(data);
}

export function validateNoteId(id: unknown) {
  return noteIdSchema.safeParse(id);
}

export function validateNoteListOptions(options: unknown) {
  return noteListOptionsSchema.safeParse(options);
}

