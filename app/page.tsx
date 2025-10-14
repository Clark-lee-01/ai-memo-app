// app/page.tsx
// AI 메모장 메인 페이지
// 사용자 인증 상태를 확인하고 적절한 UI를 표시
// 관련 파일: components/auth/signin-form.tsx, app/actions/auth.ts, lib/supabase/server.ts

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI 메모장</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/reset-password"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                비밀번호 변경
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  로그아웃
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                안녕하세요, {user.email}님!
              </h2>
              <p className="text-gray-600">
                AI 메모장에 오신 것을 환영합니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
