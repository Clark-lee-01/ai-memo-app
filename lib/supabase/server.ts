// lib/supabase/server.ts
// 서버 사이드 Supabase 클라이언트 설정 파일
// 서버 액션에서 사용할 Supabase 클라이언트를 생성
// 관련 파일: .env.local, app/actions/auth.ts, lib/supabase/client.ts

import { createServerClient as createServerClientFromSSR } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClientFromSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export const createServerClient = createClient