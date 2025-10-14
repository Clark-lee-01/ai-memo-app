// app/onboarding/page.tsx
// 온보딩 페이지
// 신규 사용자를 위한 온보딩 플로우 제공
// 관련 파일: components/onboarding/onboarding-flow.tsx, middleware.ts

import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // 이미 온보딩을 완료한 사용자는 메인 페이지로 리다이렉트
  if (user.user_metadata?.onboarding_completed) {
    redirect('/')
  }

  return <OnboardingFlow />
}

