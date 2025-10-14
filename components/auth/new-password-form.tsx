// components/auth/new-password-form.tsx
// 새 비밀번호 설정 폼 컴포넌트
// 비밀번호 입력 및 실시간 유효성 검사를 제공
// 관련 파일: app/auth/reset-password/confirm/page.tsx, app/actions/auth.ts, components/ui/form.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePasswordAction } from '@/app/actions/auth'

interface NewPasswordFormProps {
  code: string
}

export function NewPasswordForm({ code }: NewPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  const router = useRouter()

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다'
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return '비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다'
    }
    return null
  }

  // 실시간 유효성 검사
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const error = validatePassword(value)
    if (error) {
      setErrors(prev => ({ ...prev, password: error }))
    } else {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (value && value !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다' }))
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // 클라이언트 사이드 유효성 검사
    const passwordError = validatePassword(password)
    if (passwordError) {
      setErrors({ password: passwordError })
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: '비밀번호가 일치하지 않습니다' })
      setIsLoading(false)
      return
    }

    try {
      const result = await updatePasswordAction({ 
        password, 
        code 
      })
      
      if (result.success) {
        router.push('/auth/signin?message=비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.')
      } else {
        setErrors({ general: result.error || '비밀번호 변경에 실패했습니다' })
      }
    } catch (error) {
      setErrors({ general: '예상치 못한 오류가 발생했습니다' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="password">새 비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          placeholder="최소 8자, 영문자, 숫자, 특수문자 포함"
          required
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          required
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
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
        {isLoading ? '처리 중...' : '비밀번호 변경'}
      </Button>
    </form>
  )
}
