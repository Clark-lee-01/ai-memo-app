// __tests__/components/reset-password-form.test.tsx
// 비밀번호 재설정 요청 폼 컴포넌트 테스트
// 이메일 유효성 검사, 폼 제출, 에러 처리 등을 테스트
// 관련 파일: components/auth/reset-password-form.tsx, app/actions/auth.ts

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { resetPasswordAction } from '@/app/actions/auth'

// Mock the server action
jest.mock('@/app/actions/auth', () => ({
  resetPasswordAction: jest.fn(),
}))

const mockResetPasswordAction = resetPasswordAction as jest.MockedFunction<typeof resetPasswordAction>

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('이메일 입력 필드를 렌더링한다', () => {
    render(<ResetPasswordForm />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument()
  })

  it('이메일 유효성 검사를 실시간으로 수행한다', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    
    // 잘못된 이메일 형식 입력
    await user.type(emailInput, 'invalid-email')
    
    expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument()
    
    // 올바른 이메일 형식으로 수정
    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')
    
    expect(screen.queryByText('올바른 이메일 형식이 아닙니다')).not.toBeInTheDocument()
  })

  it('성공적으로 비밀번호 재설정 요청을 처리한다', async () => {
    const user = userEvent.setup()
    mockResetPasswordAction.mockResolvedValue({ success: true })
    
    render(<ResetPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockResetPasswordAction).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
    
    expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument()
    expect(screen.getByText(/test@example.com로 비밀번호 재설정 링크를 발송했습니다/)).toBeInTheDocument()
  })

  it('비밀번호 재설정 요청 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    mockResetPasswordAction.mockResolvedValue({ 
      success: false, 
      error: '등록되지 않은 이메일입니다' 
    })
    
    render(<ResetPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('등록되지 않은 이메일입니다')).toBeInTheDocument()
    })
  })

  it('로딩 상태를 올바르게 표시한다', async () => {
    const user = userEvent.setup()
    mockResetPasswordAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    render(<ResetPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('다시 시도 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    mockResetPasswordAction.mockResolvedValue({ success: true })
    
    render(<ResetPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument()
    })
    
    const retryButton = screen.getByRole('button', { name: '다시 시도' })
    await user.click(retryButton)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비밀번호 재설정 링크 발송' })).toBeInTheDocument()
  })
})
