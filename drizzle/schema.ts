// drizzle/schema.ts
// 데이터베이스 스키마 정의 - notes, note_tags, summaries 테이블
// AI 메모장 프로젝트의 핵심 데이터 모델

import { pgTable, uuid, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Notes 테이블 - 사용자 노트 저장
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id),
}, (table) => ({
  userIdIdx: index('notes_user_id_idx').on(table.userId),
  createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
  deletedAtIdx: index('notes_deleted_at_idx').on(table.deletedAt),
}));

// Note Tags 테이블 - 노트 태그 저장
export const noteTags = pgTable('note_tags', {
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.tag] }),
  tagIdx: index('note_tags_tag_idx').on(table.tag),
}));

// Summaries 테이블 - AI 생성 요약 저장
export const summaries = pgTable('summaries', {
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.model] }),
}));

// Users 테이블 참조 (Supabase auth.users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 관계 정의
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  tags: many(noteTags),
  summaries: many(summaries),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  note: one(notes, {
    fields: [summaries.noteId],
    references: [notes.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));
