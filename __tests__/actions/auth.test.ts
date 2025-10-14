// __tests__/actions/auth.test.ts
// 인증 서버 액션 테스트
// 회원가입, 로그인, 로그아웃 액션의 동작을 테스트
// 관련 파일: app/actions/auth.ts, lib/supabase/server.ts

import { signUpAction, signInAction } from '@/app/actions/auth'

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
})
