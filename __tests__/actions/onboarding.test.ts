// __tests__/actions/onboarding.test.ts
// 온보딩 서버 액션 테스트
// completeOnboardingAction, skipOnboardingAction 테스트
// 관련 파일: app/actions/onboarding.ts

import { completeOnboardingAction, skipOnboardingAction } from '@/app/actions/onboarding'
import { createClient } from '@/lib/supabase/server'

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Onboarding Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('completeOnboardingAction', () => {
    it('성공적으로 온보딩을 완료한다', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
      const mockUpdateUser = jest.fn().mockResolvedValue({ error: null })

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser,
          updateUser: mockUpdateUser,
        },
      } as any)

      const result = await completeOnboardingAction()

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: {
          onboarding_completed: true,
          onboarding_completed_at: expect.any(String),
        },
      })
    })

    it('사용자 인증 실패 시 에러를 반환한다', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const result = await completeOnboardingAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('사용자 인증에 실패했습니다')
    })

    it('업데이트 실패 시 에러를 반환한다', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
      const mockUpdateUser = jest.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      })

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser,
          updateUser: mockUpdateUser,
        },
      } as any)

      const result = await completeOnboardingAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('온보딩 완료 처리에 실패했습니다')
    })
  })

  describe('skipOnboardingAction', () => {
    it('건너뛰기도 온보딩 완료로 처리한다', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
      const mockUpdateUser = jest.fn().mockResolvedValue({ error: null })

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: mockGetUser,
          updateUser: mockUpdateUser,
        },
      } as any)

      const result = await skipOnboardingAction()

      expect(result.success).toBe(true)
      expect(mockUpdateUser).toHaveBeenCalled()
    })
  })
})

