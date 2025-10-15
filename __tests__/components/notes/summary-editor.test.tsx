// __tests__/components/notes/summary-editor.test.tsx
// SummaryEditor 컴포넌트 테스트 - 요약 편집 기능 테스트
// AI 메모장 프로젝트의 요약 편집 UI 컴포넌트 테스트
// 관련 파일: components/notes/summary-editor.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SummaryEditor } from '@/components/notes/summary-editor';

// useEditing 훅 모킹
jest.mock('@/lib/hooks/useEditing', () => ({
  useEditing: jest.fn(),
}));

// updateNoteSummary 액션 모킹
jest.mock('@/app/actions/notes', () => ({
  updateNoteSummary: jest.fn(),
}));

describe('SummaryEditor', () => {
  const mockProps = {
    noteId: 'test-note-id',
    initialContent: 'Test summary content',
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 모킹 설정
    const { useEditing } = require('@/lib/hooks/useEditing');
    useEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });
  });

  it('초기 내용이 올바르게 표시된다', () => {
    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByDisplayValue('Test summary content')).toBeInTheDocument();
    expect(screen.getByText('요약 편집')).toBeInTheDocument();
  });

  it('저장 버튼이 올바르게 표시된다', () => {
    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByRole('button', { name: /저장/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
  });

  it('텍스트 입력이 작동한다', () => {
    render(<SummaryEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue('Test summary content');
    fireEvent.change(textarea, { target: { value: 'New content' } });

    expect(textarea).toHaveValue('New content');
  });

  it('저장 버튼 클릭 시 저장 함수가 호출된다', () => {
    const mockSaveEditing = jest.fn();
    const { useEditing } = require('@/lib/hooks/useEditing');
    
    useEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: mockSaveEditing,
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    const saveButton = screen.getByRole('button', { name: /저장/ });
    fireEvent.click(saveButton);

    expect(mockSaveEditing).toHaveBeenCalled();
  });

  it('취소 버튼 클릭 시 취소 함수가 호출된다', () => {
    const mockCancelEditing = jest.fn();
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: mockCancelEditing,
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: /취소/ });
    fireEvent.click(cancelButton);

    expect(mockCancelEditing).toHaveBeenCalled();
  });

  it('저장 중 상태가 올바르게 표시된다', () => {
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: true,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: false,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: true,
        isError: false,
        isSuccess: false,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByText('요약을 저장하고 있습니다...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /저장 중/ })).toBeDisabled();
  });

  it('에러 상태가 올바르게 표시된다', () => {
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: true,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => '저장 실패'),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: true,
        isSuccess: false,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByText('저장 실패')).toBeInTheDocument();
  });

  it('성공 상태가 올바르게 표시된다', () => {
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: true,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: true,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByText('요약이 성공적으로 저장되었습니다')).toBeInTheDocument();
  });

  it('변경사항이 있을 때 표시된다', () => {
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { content: 'original content' },
      editedData: { content: 'edited content' },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: jest.fn(),
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<SummaryEditor {...mockProps} />);

    expect(screen.getByText('변경사항이 있습니다')).toBeInTheDocument();
  });
});
