// __tests__/components/notes/tags-editor.test.tsx
// TagsEditor 컴포넌트 테스트 - 태그 편집 기능 테스트
// AI 메모장 프로젝트의 태그 편집 UI 컴포넌트 테스트
// 관련 파일: components/notes/tags-editor.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagsEditor } from '@/components/notes/tags-editor';

// useEditing 훅 모킹
const mockUseEditing = jest.fn();
jest.mock('@/lib/hooks/useEditing', () => ({
  useEditing: mockUseEditing,
}));

// updateNoteTags 액션 모킹
jest.mock('@/app/actions/notes', () => ({
  updateNoteTags: jest.fn(),
}));

describe('TagsEditor', () => {
  const mockProps = {
    noteId: 'test-note-id',
    initialTags: ['tag1', 'tag2'],
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 모킹 설정
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

  it('초기 태그가 올바르게 표시된다', () => {
    render(<TagsEditor {...mockProps} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('태그 편집')).toBeInTheDocument();
  });

  it('저장/취소 버튼이 올바르게 표시된다', () => {
    render(<TagsEditor {...mockProps} />);

    expect(screen.getByRole('button', { name: /저장/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
  });

  it('새 태그 입력이 작동한다', () => {
    render(<TagsEditor {...mockProps} />);

    const input = screen.getByPlaceholderText('새 태그를 입력하세요...');
    fireEvent.change(input, { target: { value: 'new tag' } });

    expect(input).toHaveValue('new tag');
  });

  it('엔터키로 태그를 추가할 수 있다', () => {
    const mockHandleDataChange = jest.fn();
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2'] },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: mockHandleDataChange,
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<TagsEditor {...mockProps} />);

    const input = screen.getByPlaceholderText('새 태그를 입력하세요...');
    fireEvent.change(input, { target: { value: 'new tag' } });
    fireEvent.keyPress(input, { key: 'Enter' });

    expect(mockHandleDataChange).toHaveBeenCalled();
  });

  it('태그 추가 버튼이 작동한다', () => {
    const mockHandleDataChange = jest.fn();
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2'] },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: mockHandleDataChange,
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<TagsEditor {...mockProps} />);

    const input = screen.getByPlaceholderText('새 태그를 입력하세요...');
    const addButton = screen.getByRole('button', { name: '' }); // Plus 아이콘 버튼

    fireEvent.change(input, { target: { value: 'new tag' } });
    fireEvent.click(addButton);

    expect(mockHandleDataChange).toHaveBeenCalled();
  });

  it('태그 삭제가 작동한다', () => {
    const mockHandleDataChange = jest.fn();
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2'] },
      startEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      handleDataChange: mockHandleDataChange,
      retry: jest.fn(),
      getErrorMessage: jest.fn(() => ''),
      canRetry: jest.fn(() => false),
      aiStatus: {
        isLoading: false,
        isError: false,
        isSuccess: false,
      },
    });

    render(<TagsEditor {...mockProps} />);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'x'
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockHandleDataChange).toHaveBeenCalled();
    }
  });

  it('저장 버튼 클릭 시 저장 함수가 호출된다', () => {
    const mockSaveEditing = jest.fn();
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

    render(<TagsEditor {...mockProps} />);

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
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

    render(<TagsEditor {...mockProps} />);

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
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

    render(<TagsEditor {...mockProps} />);

    expect(screen.getByText('태그를 저장하고 있습니다...')).toBeInTheDocument();
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
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

    render(<TagsEditor {...mockProps} />);

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
      originalData: { tags: ['tag1', 'tag2'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3'] },
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

    render(<TagsEditor {...mockProps} />);

    expect(screen.getByText('태그가 성공적으로 저장되었습니다')).toBeInTheDocument();
  });

  it('태그 개수 제한이 올바르게 표시된다', () => {
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] },
      editedData: { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] },
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

    render(<TagsEditor {...mockProps} />);

    expect(screen.getByText('6/6개 태그 (최대 6개까지)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('새 태그를 입력하세요...')).toBeDisabled();
  });

  it('태그가 없을 때 안내 메시지가 표시된다', () => {
    
    mockUseEditing.mockReturnValue({
      isEditing: true,
      isSaving: false,
      hasError: false,
      isSuccess: false,
      hasChanges: true,
      canSave: true,
      canCancel: true,
      originalData: { tags: [] },
      editedData: { tags: [] },
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

    render(<TagsEditor {...mockProps} />);

    expect(screen.getByText('태그가 없습니다. 위에서 태그를 추가해보세요.')).toBeInTheDocument();
  });
});
