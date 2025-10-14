// __tests__/components/signup-form.test.tsx
// 회원가입 폼 컴포넌트 테스트
// 폼 유효성 검사 및 사용자 상호작용을 테스트
// 관련 파일: components/auth/signup-form.tsx, app/actions/auth.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignUpForm } from '@/components/auth/signup-form'

// signUpAction 모킹
jest.mock('@/app/actions/auth', () => ({
  signUpAction: jest.fn(),
}))

import { signUpAction } from '@/app/actions/auth'

const mockSignUpAction = signUpAction as jest.MockedFunction<typeof signUpAction>

describe('SignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('이메일과 비밀번호 입력 필드를 렌더링한다', () => {
    render(<SignUpForm />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
  })

  it('잘못된 이메일 형식에 대해 실시간 유효성 검사를 표시한다', async () => {
    render(<SignUpForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument()
    })
  })

  it('비밀번호가 8자 미만일 때 유효성 검사 오류를 표시한다', async () => {
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    fireEvent.change(passwordInput, { target: { value: '123' } })
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument()
    })
  })

  it('비밀번호에 영문자, 숫자, 특수문자가 없을 때 유효성 검사 오류를 표시한다', async () => {
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    fireEvent.change(passwordInput, { target: { value: '12345678' } })
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다')).toBeInTheDocument()
    })
  })

  it('비밀번호에 특수문자가 없을 때 유효성 검사 오류를 표시한다', async () => {
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다')).toBeInTheDocument()
    })
  })

  it('비밀번호 확인이 일치하지 않을 때 오류를 표시한다', async () => {
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123!' } })
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
    })
  })

  it('유효한 데이터로 회원가입을 시도한다', async () => {
    mockSignUpAction.mockResolvedValue({ success: true })
    
    render(<SignUpForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '회원가입' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123!' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUpAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123!',
      })
    })
  })

  it('회원가입 실패 시 에러 메시지를 표시한다', async () => {
    mockSignUpAction.mockResolvedValue({ 
      success: false, 
      error: '이미 사용 중인 이메일입니다' 
    })
    
    render(<SignUpForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '회원가입' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123!' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다')).toBeInTheDocument()
    })
  })
})
