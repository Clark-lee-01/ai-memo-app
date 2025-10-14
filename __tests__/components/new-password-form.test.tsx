// __tests__/components/new-password-form.test.tsx
// 새 비밀번호 설정 폼 컴포넌트 테스트
// 비밀번호 유효성 검사, 비밀번호 확인, 폼 제출 등을 테스트
// 관련 파일: components/auth/new-password-form.tsx, app/actions/auth.ts

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewPasswordForm } from '@/components/auth/new-password-form'
import { updatePasswordAction } from '@/app/actions/auth'

// Mock the server action
jest.mock('@/app/actions/auth', () => ({
  updatePasswordAction: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockUpdatePasswordAction = updatePasswordAction as jest.MockedFunction<typeof updatePasswordAction>

describe('NewPasswordForm', () => {
  const mockProps = {
    code: 'test-code',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('비밀번호 입력 필드들을 렌더링한다', () => {
    render(<NewPasswordForm {...mockProps} />)
    
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('최소 8자, 영문자, 숫자, 특수문자 포함')).toBeInTheDocument()
  })

  it('비밀번호 유효성 검사를 실시간으로 수행한다', async () => {
    const user = userEvent.setup()
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    
    // 너무 짧은 비밀번호
    await user.type(passwordInput, '123')
    
    expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument()
    
    // 특수문자가 없는 비밀번호
    await user.clear(passwordInput)
    await user.type(passwordInput, 'password123')
    
    expect(screen.getByText('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다')).toBeInTheDocument()
    
    // 올바른 비밀번호
    await user.clear(passwordInput)
    await user.type(passwordInput, 'password123!')
    
    expect(screen.queryByText('비밀번호는 최소 8자 이상이어야 합니다')).not.toBeInTheDocument()
    expect(screen.queryByText('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다')).not.toBeInTheDocument()
  })

  it('비밀번호 확인 유효성 검사를 수행한다', async () => {
    const user = userEvent.setup()
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    
    await user.type(passwordInput, 'password123!')
    await user.type(confirmPasswordInput, 'different123!')
    
    expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
    
    await user.clear(confirmPasswordInput)
    await user.type(confirmPasswordInput, 'password123!')
    
    expect(screen.queryByText('비밀번호가 일치하지 않습니다')).not.toBeInTheDocument()
  })

  it('성공적으로 비밀번호를 업데이트한다', async () => {
    const user = userEvent.setup()
    mockUpdatePasswordAction.mockResolvedValue({ success: true })
    
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })
    
    await user.type(passwordInput, 'password123!')
    await user.type(confirmPasswordInput, 'password123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockUpdatePasswordAction).toHaveBeenCalledWith({
        password: 'password123!',
        code: 'test-code',
      })
    })
  })

  it('비밀번호 업데이트 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    mockUpdatePasswordAction.mockResolvedValue({ 
      success: false, 
      error: '유효하지 않거나 만료된 링크입니다' 
    })
    
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })
    
    await user.type(passwordInput, 'password123!')
    await user.type(confirmPasswordInput, 'password123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('유효하지 않거나 만료된 링크입니다')).toBeInTheDocument()
    })
  })

  it('로딩 상태를 올바르게 표시한다', async () => {
    const user = userEvent.setup()
    mockUpdatePasswordAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })
    
    await user.type(passwordInput, 'password123!')
    await user.type(confirmPasswordInput, 'password123!')
    await user.click(submitButton)
    
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('클라이언트 사이드 유효성 검사가 작동한다', async () => {
    const user = userEvent.setup()
    render(<NewPasswordForm {...mockProps} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })
    
    // 잘못된 비밀번호로 제출 시도
    await user.type(passwordInput, '123')
    await user.type(confirmPasswordInput, '123')
    await user.click(submitButton)
    
    expect(mockUpdatePasswordAction).not.toHaveBeenCalled()
    expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument()
  })
})
