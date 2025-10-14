// components/auth/signup-form.tsx
// 회원가입 폼 컴포넌트
// 이메일/비밀번호 입력 및 실시간 유효성 검사를 제공
// 관련 파일: app/auth/signup/page.tsx, app/actions/auth.ts, components/ui/form.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpAction } from '@/app/actions/auth'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

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
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }))
    } else {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

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
    if (!validateEmail(email)) {
      setErrors({ email: '올바른 이메일 형식이 아닙니다' })
      setIsLoading(false)
      return
    }

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
      const result = await signUpAction({ email, password })
      
      if (result.success) {
        // 회원가입 성공 시 로그인 페이지로 리다이렉트
        window.location.href = '/auth/signin?message=회원가입이 완료되었습니다. 이메일을 확인해주세요.'
      } else {
        setErrors({ general: result.error || '회원가입에 실패했습니다' })
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

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
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
        {isLoading ? '처리 중...' : '회원가입'}
      </Button>
    </form>
  )
}
