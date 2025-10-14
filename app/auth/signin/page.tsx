// app/auth/signin/page.tsx
// 로그인 페이지
// 사용자가 이메일과 비밀번호로 로그인할 수 있는 페이지
// 관련 파일: components/auth/signin-form.tsx, app/actions/auth.ts

import { SignInForm } from '@/components/auth/signin-form'
import Link from 'next/link'

interface SignInPageProps {
  searchParams: Promise<{
    message?: string
    error?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AI 메모장 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              회원가입하기
            </Link>
          </p>
        </div>
        
        {params.message && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{params.message}</p>
          </div>
        )}
        
        {params.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{params.error}</p>
          </div>
        )}
        
        <SignInForm />
        
        <div className="text-center">
          <Link
            href="/auth/reset-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </div>
    </div>
  )
}
