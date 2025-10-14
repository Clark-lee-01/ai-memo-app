// components/onboarding/welcome-step.tsx
// 온보딩 1단계: 환영 메시지
// 사용자를 환영하고 앱 소개
// 관련 파일: components/onboarding/onboarding-flow.tsx

export function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">👋</div>
      <h1 className="text-3xl font-bold text-gray-900">
        AI 메모장에 오신 것을 환영합니다!
      </h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        음성과 텍스트로 쉽게 메모하고, AI가 자동으로 요약하고 태그를 붙여드립니다.
      </p>
      <div className="pt-4">
        <p className="text-sm text-gray-500">
          간단한 가이드를 통해 주요 기능을 알아보세요
        </p>
      </div>
    </div>
  )
}

