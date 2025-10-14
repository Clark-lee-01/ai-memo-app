// app/auth/reset-password/page.tsx
// 비밀번호 재설정 요청 페이지
// 사용자가 이메일을 입력하여 비밀번호 재설정 링크를 요청할 수 있는 페이지
// 관련 파일: components/auth/reset-password-form.tsx, app/actions/auth.ts

import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 재설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이메일 주소를 입력하면 비밀번호 재설정 링크를 발송합니다
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
