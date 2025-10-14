// components/onboarding/guide-step.tsx
// 온보딩 3단계: 첫 메모 작성 가이드
// 메모 작성 방법 안내
// 관련 파일: components/onboarding/onboarding-flow.tsx

export function GuideStep() {
  const steps = [
    {
      number: 1,
      title: '새 메모 만들기',
      description: '메인 화면에서 "새 메모" 버튼을 클릭하세요',
    },
    {
      number: 2,
      title: '내용 작성',
      description: '키보드로 입력하거나 마이크 버튼으로 음성 입력하세요',
    },
    {
      number: 3,
      title: 'AI 요약 & 태그',
      description: '저장하면 AI가 자동으로 요약과 태그를 생성합니다',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          시작해볼까요?
        </h2>
        <p className="text-gray-600">
          첫 메모를 작성하는 방법은 아주 간단합니다
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
              {step.number}
            </div>
            <div className="pt-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
        <p className="text-sm text-indigo-900 text-center">
          💡 <strong>팁:</strong> 음성 메모는 모바일에서 특히 편리합니다!
        </p>
      </div>
    </div>
  )
}

