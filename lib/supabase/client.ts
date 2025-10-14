// lib/supabase/client.ts
// Supabase 클라이언트 설정 파일
// 클라이언트 사이드에서 사용할 Supabase 클라이언트를 생성
// 관련 파일: .env.local, app/actions/auth.ts, components/auth/signup-form.tsx

import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
