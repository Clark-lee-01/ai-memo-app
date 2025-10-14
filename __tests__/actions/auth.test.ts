// __tests__/actions/auth.test.ts
// 인증 서버 액션 테스트
// 회원가입, 로그인, 로그아웃 액션의 동작을 테스트
// 관련 파일: app/actions/auth.ts, lib/supabase/server.ts

import { 
  signUpAction, 
  signInAction, 
  signOutAction,
  resetPasswordAction,
  updatePasswordAction 
} from '@/app/actions/auth'

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}))

import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUpAction', () => {
    it('유효한 이메일과 비밀번호로 회원가입을 성공한다', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: { id: '123', email: 'test@example.com' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signUpAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123!',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('이미 존재하는 이메일로 회원가입을 시도할 때 오류를 반환한다', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'User already registered' },
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signUpAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이미 사용 중인 이메일입니다')
    })

    it('Supabase 에러를 적절히 처리한다', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'already registered' },
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signUpAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이미 사용 중인 이메일입니다')
    })
  })

  describe('signInAction', () => {
    it('유효한 이메일과 비밀번호로 로그인을 성공한다', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: { user: { id: '123', email: 'test@example.com' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signInAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual({ id: '123', email: 'test@example.com' })
    })

    it('잘못된 자격 증명으로 로그인을 시도할 때 사용자 친화적 오류를 반환한다', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid login credentials' },
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signInAction({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
    })

    it('이메일 인증이 완료되지 않은 경우 적절한 오류를 반환한다', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Email not confirmed' },
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signInAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요')
    })

    it('너무 많은 요청 시 적절한 오류를 반환한다', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Too many requests' },
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const result = await signInAction({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요')
    })
  })

  describe('resetPasswordAction', () => {
    it('성공적으로 비밀번호 재설정 이메일을 발송한다', async () => {
      const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ error: null })
      mockCreateClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      } as any)

      const result = await resetPasswordAction({ email: 'test@example.com' })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/reset-password/confirm'),
      })
    })

    it('등록되지 않은 이메일 에러를 처리한다', async () => {
      const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ 
        error: { message: 'User not found' } 
      })
      mockCreateClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      } as any)

      const result = await resetPasswordAction({ email: 'test@example.com' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('등록되지 않은 이메일입니다')
    })

    it('이메일 발송 한도 초과 에러를 처리한다', async () => {
      const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ 
        error: { message: 'Email rate limit exceeded' } 
      })
      mockCreateClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: mockResetPasswordForEmail,
        },
      } as any)

      const result = await resetPasswordAction({ email: 'test@example.com' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요')
    })
  })

  describe('updatePasswordAction', () => {
    it('성공적으로 비밀번호를 업데이트한다', async () => {
      const mockExchangeCodeForSession = jest.fn().mockResolvedValue({ error: null })
      const mockUpdateUser = jest.fn().mockResolvedValue({ error: null })
      mockCreateClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: mockExchangeCodeForSession,
          updateUser: mockUpdateUser,
        },
      } as any)

      const result = await updatePasswordAction({
        password: 'newpassword123!',
        code: 'test-code',
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code')
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123!',
      })
    })

    it('유효하지 않은 코드 에러를 처리한다', async () => {
      const mockExchangeCodeForSession = jest.fn().mockResolvedValue({ 
        error: { message: 'Invalid code' } 
      })
      mockCreateClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: mockExchangeCodeForSession,
        },
      } as any)

      const result = await updatePasswordAction({
        password: 'newpassword123!',
        code: 'invalid-code',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('유효하지 않거나 만료된 링크입니다')
    })

    it('비밀번호 업데이트 에러를 처리한다', async () => {
      const mockExchangeCodeForSession = jest.fn().mockResolvedValue({ error: null })
      const mockUpdateUser = jest.fn().mockResolvedValue({ 
        error: { message: 'Password should be at least 6 characters' } 
      })
      mockCreateClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: mockExchangeCodeForSession,
          updateUser: mockUpdateUser,
        },
      } as any)

      const result = await updatePasswordAction({
        password: '123',
        code: 'test-code',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('비밀번호는 최소 6자 이상이어야 합니다')
    })
  })
})
