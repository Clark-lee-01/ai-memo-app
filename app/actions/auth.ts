// app/actions/auth.ts
// 인증 관련 서버 액션들
// 회원가입, 로그인, 로그아웃 등의 서버 사이드 로직을 처리
// 관련 파일: lib/supabase/server.ts, components/auth/signup-form.tsx

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface SignUpResult {
  success: boolean
  error?: string
}

export async function signUpAction({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<SignUpResult> {
  try {
    const supabase = await createClient()

    // 회원가입 처리 (Supabase Auth가 자동으로 중복 이메일을 처리)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      // Supabase 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = '회원가입에 실패했습니다'
      
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        errorMessage = '이미 사용 중인 이메일입니다'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '올바른 이메일 형식이 아닙니다'
      } else if (error.message.includes('Signup is disabled')) {
        errorMessage = '현재 회원가입이 비활성화되어 있습니다'
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요'
      } else {
        // 디버깅을 위해 원본 에러 메시지도 포함
        console.error('Signup error:', error)
        errorMessage = `회원가입에 실패했습니다: ${error.message}`
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    if (data.user && !data.user.email_confirmed_at) {
      return {
        success: true,
        error: '이메일 인증 링크가 발송되었습니다. 이메일을 확인해주세요.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: '예상치 못한 오류가 발생했습니다',
    }
  }
}

export async function signInAction({
  email,
  password,
}: {
  email: string
  password: string
}) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Supabase 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = '로그인에 실패했습니다'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요'
      } else if (error.message.includes('User not found')) {
        errorMessage = '등록되지 않은 이메일입니다'
      } else {
        // 디버깅을 위해 원본 에러 메시지도 포함
        console.error('Sign in error:', error)
        errorMessage = `로그인에 실패했습니다: ${error.message}`
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: '예상치 못한 오류가 발생했습니다',
    }
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    redirect('/auth/signin')
  }
}
