// __tests__/components/signin-form.test.tsx
// 로그인 폼 컴포넌트 테스트
// 폼 유효성 검사 및 사용자 상호작용을 테스트
// 관련 파일: components/auth/signin-form.tsx, app/actions/auth.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignInForm } from '@/components/auth/signin-form'

// signInAction 모킹
jest.mock('@/app/actions/auth', () => ({
  signInAction: jest.fn(),
}))

import { signInAction } from '@/app/actions/auth'

const mockSignInAction = signInAction as jest.MockedFunction<typeof signInAction>

// useRouter 모킹
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('이메일과 비밀번호 입력 필드를 렌더링한다', () => {
    render(<SignInForm />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('잘못된 이메일 형식에 대해 실시간 유효성 검사를 표시한다', async () => {
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument()
    })
  })

  it('유효한 이메일 형식에 대해 에러가 사라진다', async () => {
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument()
    })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    await waitFor(() => {
      expect(screen.queryByText('올바른 이메일 형식이 아닙니다')).not.toBeInTheDocument()
    })
  })

  it('유효한 데이터로 로그인을 시도한다', async () => {
    mockSignInAction.mockResolvedValue({ 
      success: true, 
      user: { id: '123', email: 'test@example.com' } 
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignInAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123!',
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('잘못된 자격 증명으로 로그인을 시도할 때 에러 메시지를 표시한다', async () => {
    mockSignInAction.mockResolvedValue({ 
      success: false, 
      error: '이메일 또는 비밀번호가 올바르지 않습니다' 
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument()
    })
  })

  it('이메일 인증이 완료되지 않은 경우 에러 메시지를 표시한다', async () => {
    mockSignInAction.mockResolvedValue({ 
      success: false, 
      error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요' 
    })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요')).toBeInTheDocument()
    })
  })

  it('로딩 상태를 올바르게 표시한다', async () => {
    mockSignInAction.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, user: { id: '123' } }), 100)
    ))
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123!' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('로그인 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('로그인')).toBeInTheDocument()
    })
  })
})
