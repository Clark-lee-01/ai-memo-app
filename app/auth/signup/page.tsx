// app/auth/signup/page.tsx
// 회원가입 페이지
// 사용자가 이메일과 비밀번호로 계정을 생성할 수 있는 페이지
// 관련 파일: components/auth/signup-form.tsx, app/actions/auth.ts

import { SignUpForm } from '@/components/auth/signup-form'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AI 메모장 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              로그인하기
            </Link>
          </p>
        </div>
        
        <SignUpForm />
      </div>
    </div>
  )
}
