// __tests__/components/onboarding/onboarding-flow.test.tsx
// 온보딩 플로우 컴포넌트 테스트
// 단계 전환, 건너뛰기, 완료 기능 테스트
// 관련 파일: components/onboarding/onboarding-flow.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { completeOnboardingAction, skipOnboardingAction } from '@/app/actions/onboarding'

// Mock the server actions
jest.mock('@/app/actions/onboarding', () => ({
  completeOnboardingAction: jest.fn(),
  skipOnboardingAction: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockCompleteOnboardingAction = completeOnboardingAction as jest.MockedFunction<typeof completeOnboardingAction>
const mockSkipOnboardingAction = skipOnboardingAction as jest.MockedFunction<typeof skipOnboardingAction>

describe('OnboardingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('첫 번째 단계를 렌더링한다', () => {
    render(<OnboardingFlow />)
    
    expect(screen.getByText('AI 메모장에 오신 것을 환영합니다!')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('다음 버튼을 클릭하면 두 번째 단계로 이동한다', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    
    const nextButton = screen.getByRole('button', { name: '다음' })
    await user.click(nextButton)
    
    expect(screen.getByText('주요 기능')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('이전 버튼을 클릭하면 이전 단계로 이동한다', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    
    // 두 번째 단계로 이동
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByText('주요 기능')).toBeInTheDocument()
    
    // 첫 번째 단계로 돌아가기
    await user.click(screen.getByRole('button', { name: '이전' }))
    expect(screen.getByText('AI 메모장에 오신 것을 환영합니다!')).toBeInTheDocument()
  })

  it('세 번째 단계에서 시작하기 버튼이 표시된다', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    
    // 세 번째 단계로 이동
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    
    expect(screen.getByText('시작해볼까요?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
  })

  it('건너뛰기 버튼을 클릭하면 skipOnboardingAction이 호출된다', async () => {
    const user = userEvent.setup()
    mockSkipOnboardingAction.mockResolvedValue({ success: true })
    
    render(<OnboardingFlow />)
    
    const skipButton = screen.getByRole('button', { name: '건너뛰기' })
    await user.click(skipButton)
    
    await waitFor(() => {
      expect(mockSkipOnboardingAction).toHaveBeenCalled()
    })
  })

  it('시작하기 버튼을 클릭하면 completeOnboardingAction이 호출된다', async () => {
    const user = userEvent.setup()
    mockCompleteOnboardingAction.mockResolvedValue({ success: true })
    
    render(<OnboardingFlow />)
    
    // 세 번째 단계로 이동
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    
    const startButton = screen.getByRole('button', { name: '시작하기' })
    await user.click(startButton)
    
    await waitFor(() => {
      expect(mockCompleteOnboardingAction).toHaveBeenCalled()
    })
  })

  it('진행 상태 표시가 올바르게 업데이트된다', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('로딩 중에는 버튼이 비활성화된다', async () => {
    const user = userEvent.setup()
    mockCompleteOnboardingAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    render(<OnboardingFlow />)
    
    // 세 번째 단계로 이동
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    
    const startButton = screen.getByRole('button', { name: '시작하기' })
    await user.click(startButton)
    
    expect(startButton).toBeDisabled()
    expect(screen.getByRole('button', { name: '건너뛰기' })).toBeDisabled()
  })
})

