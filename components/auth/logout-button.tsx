// components/auth/logout-button.tsx
// 로그아웃 버튼 컴포넌트
// 로그아웃 기능을 제공하는 재사용 가능한 버튼 컴포넌트
// 관련 파일: app/actions/auth.ts, components/ui/button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/actions/auth'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  children = '로그아웃'
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOutAction()
    } catch (error) {
      console.error('Logout error:', error)
      // 에러가 발생해도 로그인 페이지로 리다이렉트
      window.location.href = '/auth/signin'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? '로그아웃 중...' : children}
    </Button>
  )
}
