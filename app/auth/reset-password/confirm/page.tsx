// app/auth/reset-password/confirm/page.tsx
// 새 비밀번호 설정 페이지
// 이메일 링크를 통해 접근하여 새 비밀번호를 설정할 수 있는 페이지
// 관련 파일: components/auth/new-password-form.tsx, app/actions/auth.ts

import { NewPasswordForm } from '@/components/auth/new-password-form'

interface ConfirmResetPasswordPageProps {
  searchParams: Promise<{
    code?: string
    type?: string
  }>
}

export default async function ConfirmResetPasswordPage({ 
  searchParams 
}: ConfirmResetPasswordPageProps) {
  const params = await searchParams
  const { code } = params

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              잘못된 링크
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              유효하지 않거나 만료된 링크입니다. 
              <a 
                href="/auth/reset-password" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                비밀번호 재설정을 다시 요청
              </a>
              해주세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>
        <NewPasswordForm code={code} />
      </div>
    </div>
  )
}
