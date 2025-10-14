// components/onboarding/onboarding-flow.tsx
// 온보딩 플로우 메인 컴포넌트
// 3단계 온보딩 화면을 관리하고 표시
// 관련 파일: app/onboarding/page.tsx, app/actions/onboarding.ts

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { completeOnboardingAction, skipOnboardingAction } from '@/app/actions/onboarding'
import { WelcomeStep } from './welcome-step'
import { FeaturesStep } from './features-step'
import { GuideStep } from './guide-step'

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const totalSteps = 3

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    setIsLoading(true)
    try {
      const result = await skipOnboardingAction()
      if (result.success) {
        router.push('/')
      }
    } catch (error) {
      console.error('Skip onboarding error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const result = await completeOnboardingAction()
      if (result.success) {
        router.push('/')
      }
    } catch (error) {
      console.error('Complete onboarding error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {currentStep} / {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {currentStep === 1 && <WelcomeStep />}
          {currentStep === 2 && <FeaturesStep />}
          {currentStep === 3 && <GuideStep />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handleSkip}
            variant="ghost"
            disabled={isLoading}
          >
            건너뛰기
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={isLoading}
              >
                이전
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              {currentStep === totalSteps ? '시작하기' : '다음'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

