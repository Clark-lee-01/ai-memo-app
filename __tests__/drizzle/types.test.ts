// __tests__/drizzle/types.test.ts
// 타입 정의 테스트 - TypeScript 타입 정확성 검증
// AI 메모장 프로젝트의 타입 안전성 보장

import { describe, it, expect } from '@jest/globals';
import { 
  Note, 
  NewNote, 
  NoteTag, 
  NewNoteTag, 
  Summary, 
  NewSummary,
  NoteWithRelations,
  CreateNoteData,
  UpdateNoteData
} from '../../lib/types/database';

describe('Database Types', () => {
  describe('Note types', () => {
    it('should have correct Note type structure', () => {
      const note: Note = {
        id: 'test-id',
        userId: 'user-id',
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(note.id).toBe('test-id');
      expect(note.userId).toBe('user-id');
      expect(note.title).toBe('Test Note');
      expect(note.content).toBe('Test content');
    });

    it('should have correct NewNote type structure', () => {
      const newNote: NewNote = {
        userId: 'user-id',
        title: 'New Note',
        content: 'New content',
      };

      expect(newNote.userId).toBe('user-id');
      expect(newNote.title).toBe('New Note');
      expect(newNote.content).toBe('New content');
    });

    it('should have correct CreateNoteData type', () => {
      const createData: CreateNoteData = {
        userId: 'user-id',
        title: 'Create Note',
        content: 'Create content',
      };

      expect(createData.userId).toBe('user-id');
      expect(createData.title).toBe('Create Note');
      expect(createData.content).toBe('Create content');
    });

    it('should have correct UpdateNoteData type', () => {
      const updateData: UpdateNoteData = {
        title: 'Updated Note',
        content: 'Updated content',
      };

      expect(updateData.title).toBe('Updated Note');
      expect(updateData.content).toBe('Updated content');
    });
  });

  describe('NoteTag types', () => {
    it('should have correct NoteTag type structure', () => {
      const noteTag: NoteTag = {
        noteId: 'note-id',
        tag: 'test-tag',
      };

      expect(noteTag.noteId).toBe('note-id');
      expect(noteTag.tag).toBe('test-tag');
    });

    it('should have correct NewNoteTag type structure', () => {
      const newNoteTag: NewNoteTag = {
        noteId: 'note-id',
        tag: 'new-tag',
      };

      expect(newNoteTag.noteId).toBe('note-id');
      expect(newNoteTag.tag).toBe('new-tag');
    });
  });

  describe('Summary types', () => {
    it('should have correct Summary type structure', () => {
      const summary: Summary = {
        noteId: 'note-id',
        model: 'gemini-pro',
        content: 'AI generated summary',
        createdAt: new Date(),
      };

      expect(summary.noteId).toBe('note-id');
      expect(summary.model).toBe('gemini-pro');
      expect(summary.content).toBe('AI generated summary');
    });

    it('should have correct NewSummary type structure', () => {
      const newSummary: NewSummary = {
        noteId: 'note-id',
        model: 'gemini-pro',
        content: 'New AI summary',
      };

      expect(newSummary.noteId).toBe('note-id');
      expect(newSummary.model).toBe('gemini-pro');
      expect(newSummary.content).toBe('New AI summary');
    });
  });
});
