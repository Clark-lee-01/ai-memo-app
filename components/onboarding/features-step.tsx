// components/onboarding/features-step.tsx
// 온보딩 2단계: 주요 기능 소개
// 텍스트/음성 메모, AI 요약, 태깅 기능 소개
// 관련 파일: components/onboarding/onboarding-flow.tsx

export function FeaturesStep() {
  const features = [
    {
      icon: '📝',
      title: '텍스트 & 음성 메모',
      description: '키보드로 타이핑하거나 음성으로 빠르게 메모하세요',
    },
    {
      icon: '🤖',
      title: 'AI 자동 요약',
      description: '긴 메모도 AI가 핵심만 추려서 3~6개 불릿으로 요약해드립니다',
    },
    {
      icon: '🏷️',
      title: '스마트 태깅',
      description: 'AI가 자동으로 관련 태그를 생성해 쉽게 분류하고 찾을 수 있습니다',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          주요 기능
        </h2>
        <p className="text-gray-600">
          AI 메모장이 제공하는 핵심 기능들입니다
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="text-4xl flex-shrink-0">{feature.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

