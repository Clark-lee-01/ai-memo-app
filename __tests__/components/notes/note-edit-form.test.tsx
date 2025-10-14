// __tests__/components/notes/note-edit-form.test.tsx
// 노트 수정 폼 컴포넌트 테스트 - NoteEditForm 렌더링 및 자동 저장 기능 검증
// AI 메모장 프로젝트의 노트 수정 폼 테스트

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditForm } from '@/components/notes/note-edit-form';
import { updateNote } from '@/app/actions/notes';

// Mock dependencies
jest.mock('@/app/actions/notes', () => ({
  updateNote: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/useAutoSave', () => ({
  useAutoSave: jest.fn(() => ({
    saveStatus: { status: 'idle' },
    hasUnsavedChanges: false,
    manualSave: jest.fn(),
    resetSaveStatus: jest.fn(),
  })),
}));

const mockUpdateNote = updateNote as jest.MockedFunction<typeof updateNote>;

describe('NoteEditForm', () => {
  const mockProps = {
    noteId: 'test-note-id',
    initialData: {
      title: 'Original Title',
      content: 'Original content',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 데이터로 폼을 렌더링한다', () => {
    render(<NoteEditForm {...mockProps} />);

    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original content')).toBeInTheDocument();
    expect(screen.getByText('노트 수정')).toBeInTheDocument();
  });

  it('제목을 수정할 수 있다', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm {...mockProps} />);

    const titleInput = screen.getByDisplayValue('Original Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    expect(titleInput).toHaveValue('Updated Title');
  });

  it('본문을 수정할 수 있다', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm {...mockProps} />);

    const contentInput = screen.getByDisplayValue('Original content');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content');

    expect(contentInput).toHaveValue('Updated content');
  });

  it('수정 완료 버튼을 클릭하면 updateNote를 호출한다', async () => {
    const user = userEvent.setup();
    mockUpdateNote.mockResolvedValueOnce({} as any);

    render(<NoteEditForm {...mockProps} />);

    const submitButton = screen.getByText('수정 완료');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-id', expect.any(FormData));
    });
  });

  it('취소 버튼을 클릭하면 확인 다이얼로그를 표시한다', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false); // 취소 선택

    render(<NoteEditForm {...mockProps} />);

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    expect(window.confirm).toHaveBeenCalledWith('저장되지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?');
  });

  it('수동 저장 버튼을 클릭하면 manualSave를 호출한다', async () => {
    const user = userEvent.setup();
    const mockManualSave = jest.fn();
    
    // Mock useAutoSave to return manualSave function
    const { useAutoSave } = require('@/lib/hooks/useAutoSave');
    useAutoSave.mockReturnValueOnce({
      saveStatus: { status: 'idle' },
      hasUnsavedChanges: true,
      manualSave: mockManualSave,
      resetSaveStatus: jest.fn(),
    });

    render(<NoteEditForm {...mockProps} />);

    const manualSaveButton = screen.getByText('수동 저장');
    await user.click(manualSaveButton);

    expect(mockManualSave).toHaveBeenCalled();
  });

  it('저장 상태를 표시한다', () => {
    const { useAutoSave } = require('@/lib/hooks/useAutoSave');
    useAutoSave.mockReturnValueOnce({
      saveStatus: { status: 'saving' },
      hasUnsavedChanges: false,
      manualSave: jest.fn(),
      resetSaveStatus: jest.fn(),
    });

    render(<NoteEditForm {...mockProps} />);

    expect(screen.getByText('저장 중...')).toBeInTheDocument();
  });

  it('저장되지 않은 변경사항이 있을 때 경고를 표시한다', () => {
    const { useAutoSave } = require('@/lib/hooks/useAutoSave');
    useAutoSave.mockReturnValueOnce({
      saveStatus: { status: 'idle' },
      hasUnsavedChanges: true,
      manualSave: jest.fn(),
      resetSaveStatus: jest.fn(),
    });

    render(<NoteEditForm {...mockProps} />);

    expect(screen.getByText('⚠️ 저장되지 않은 변경사항이 있습니다')).toBeInTheDocument();
  });

  it('자동 저장 안내 메시지를 표시한다', () => {
    render(<NoteEditForm {...mockProps} />);

    expect(screen.getByText('💡 변경사항은 자동으로 저장됩니다. 수동 저장은 Ctrl+S를 사용하세요.')).toBeInTheDocument();
  });

  it('유효성 검사 에러를 표시한다', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm {...mockProps} />);

    const titleInput = screen.getByDisplayValue('Original Title');
    await user.clear(titleInput); // 제목을 비워서 유효성 검사 실패 유도

    const submitButton = screen.getByText('수정 완료');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
    });
  });

  it('Ctrl+S 키보드 단축키가 작동한다', async () => {
    const user = userEvent.setup();
    const mockManualSave = jest.fn();
    
    const { useAutoSave } = require('@/lib/hooks/useAutoSave');
    useAutoSave.mockReturnValueOnce({
      saveStatus: { status: 'idle' },
      hasUnsavedChanges: true,
      manualSave: mockManualSave,
      resetSaveStatus: jest.fn(),
    });

    render(<NoteEditForm {...mockProps} />);

    await user.keyboard('{Control>}s{/Control}');

    expect(mockManualSave).toHaveBeenCalled();
  });
});
