// app/actions/onboarding.ts
// 온보딩 관련 서버 액션
// 온보딩 완료 상태를 사용자 메타데이터에 저장
// 관련 파일: lib/supabase/server.ts, app/onboarding/page.tsx

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface OnboardingResult {
  success: boolean
  error?: string
}

export async function completeOnboardingAction(): Promise<OnboardingResult> {
  try {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: '사용자 인증에 실패했습니다',
      }
    }

    // 사용자 메타데이터에 온보딩 완료 상태 저장
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
    })

    if (updateError) {
      console.error('Onboarding completion error:', updateError)
      return {
        success: false,
        error: '온보딩 완료 처리에 실패했습니다',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return {
      success: false,
      error: '예상치 못한 오류가 발생했습니다',
    }
  }
}

export async function skipOnboardingAction(): Promise<OnboardingResult> {
  // 건너뛰기도 완료로 처리
  return completeOnboardingAction()
}

