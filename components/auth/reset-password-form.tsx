// components/auth/reset-password-form.tsx
// 비밀번호 재설정 요청 폼 컴포넌트
// 이메일 입력 및 실시간 유효성 검사를 제공
// 관련 파일: app/auth/reset-password/page.tsx, app/actions/auth.ts, components/ui/form.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordAction } from '@/app/actions/auth'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    general?: string
  }>({})

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 실시간 이메일 유효성 검사
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }))
    } else {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // 클라이언트 사이드 유효성 검사
    if (!validateEmail(email)) {
      setErrors({ email: '올바른 이메일 형식이 아닙니다' })
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPasswordAction({ email })
      
      if (result.success) {
        setIsSubmitted(true)
      } else {
        setErrors({ general: result.error || '비밀번호 재설정 요청에 실패했습니다' })
      }
    } catch (error) {
      setErrors({ general: '예상치 못한 오류가 발생했습니다' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4 w-full max-w-md mx-auto text-center">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            이메일을 확인해주세요
          </h3>
          <p className="text-sm text-green-600">
            {email}로 비밀번호 재설정 링크를 발송했습니다.
            이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.
          </p>
        </div>
        <Button 
          onClick={() => {
            setIsSubmitted(false)
            setEmail('')
          }}
          variant="outline"
          className="w-full"
        >
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="example@email.com"
          required
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? '처리 중...' : '비밀번호 재설정 링크 발송'}
      </Button>
    </form>
  )
}
