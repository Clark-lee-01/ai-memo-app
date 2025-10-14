// __tests__/components/notes/note-form.test.tsx
// 노트 폼 컴포넌트 테스트 - 노트 작성 폼 테스트
// AI 메모장 프로젝트의 노트 폼 테스트

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteForm } from '@/components/notes/note-form';
import { createNote } from '@/app/actions/notes';

// Server Action 모킹
jest.mock('@/app/actions/notes', () => ({
  createNote: jest.fn(),
}));

const mockCreateNote = createNote as jest.MockedFunction<typeof createNote>;

// Next.js router 모킹
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

describe('NoteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render note form with initial data', () => {
    render(<NoteForm mode="create" />);
    
    expect(screen.getByText('새 노트 작성')).toBeInTheDocument();
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
    expect(screen.getByLabelText(/본문/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /노트 생성/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
  });

  it('should render edit mode with initial data', () => {
    const initialData = {
      title: 'Test Title',
      content: 'Test Content',
    };
    
    render(<NoteForm mode="edit" initialData={initialData} />);
    
    expect(screen.getByRole('heading', { name: '노트 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /노트 수정/ })).toBeInTheDocument();
  });

  it('should validate title field', async () => {
    const user = userEvent.setup();
    render(<NoteForm mode="create" />);
    
    const titleInput = screen.getByLabelText(/제목/);
    
    // 제목 길이 초과 테스트 (maxLength로 인해 100자까지만 입력됨)
    const longTitle = 'a'.repeat(101);
    await user.type(titleInput, longTitle);
    
    // maxLength로 인해 실제로는 100자까지만 입력됨
    expect(titleInput).toHaveValue('a'.repeat(100));
  });

  it('should validate content field', async () => {
    render(<NoteForm mode="create" />);
    
    const contentInput = screen.getByLabelText(/본문/);
    
    // 10000자 입력 테스트
    const validContent = 'a'.repeat(10000);
    fireEvent.change(contentInput, { target: { value: validContent } });
    
    expect(contentInput).toHaveValue(validContent);
  });

  it('should show character count', async () => {
    render(<NoteForm mode="create" />);
    
    const titleInput = screen.getByLabelText(/제목/);
    const contentInput = screen.getByLabelText(/본문/);
    
    // fireEvent를 사용하여 직접 값 설정
    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(contentInput, { target: { value: 'Content' } });
    
    expect(screen.getByText('4/100')).toBeInTheDocument();
    expect(screen.getByText('7/10,000')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockResolvedValue({ success: true, noteId: 'test-id' });
    
    render(<NoteForm mode="create" />);
    
    const titleInput = screen.getByLabelText(/제목/);
    const contentInput = screen.getByLabelText(/본문/);
    const submitButton = screen.getByRole('button', { name: /노트 생성/ });
    
    await user.type(titleInput, 'Test Title');
    await user.type(contentInput, 'Test Content');
    await user.click(submitButton);
    
    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        get: expect.any(Function),
      })
    );
  });

  it('should show error message on submit failure', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockResolvedValue({ 
      success: false, 
      error: '노트 생성에 실패했습니다' 
    });
    
    render(<NoteForm mode="create" />);
    
    const titleInput = screen.getByLabelText(/제목/);
    const submitButton = screen.getByRole('button', { name: /노트 생성/ });
    
    await user.type(titleInput, 'Test Title');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('노트 생성에 실패했습니다')).toBeInTheDocument();
    });
  });

  it('should disable submit button when title is empty', () => {
    render(<NoteForm mode="create" />);
    
    const submitButton = screen.getByRole('button', { name: /노트 생성/ });
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when no changes made', () => {
    const initialData = {
      title: 'Test Title',
      content: 'Test Content',
    };
    
    render(<NoteForm mode="edit" initialData={initialData} />);
    
    const submitButton = screen.getByRole('button', { name: /노트 수정/ });
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, noteId: 'test-id' }), 100)
    ));
    
    render(<NoteForm mode="create" />);
    
    const titleInput = screen.getByLabelText(/제목/);
    const submitButton = screen.getByRole('button', { name: /노트 생성/ });
    
    await user.type(titleInput, 'Test Title');
    await user.click(submitButton);
    
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /저장 중/ })).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<NoteForm mode="create" onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /취소/ });
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });
});
