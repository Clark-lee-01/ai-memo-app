// middleware.ts
// Next.js 미들웨어 - 인증 상태 관리 및 보호된 라우트 처리
// 사용자 인증 상태를 확인하고 적절한 페이지로 리다이렉트
// 관련 파일: lib/supabase/server.ts, app/page.tsx, app/auth/signin/page.tsx

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 라우트 (인증이 필요한 페이지)
  const protectedRoutes = ['/']
  const authRoutes = ['/auth/signin', '/auth/signup']

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname === route
  )
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // 인증되지 않은 사용자가 보호된 라우트에 접근하는 경우
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하는 경우
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
