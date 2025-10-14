// jest.config.js
// Jest 테스트 설정 파일
// React 컴포넌트와 서버 액션 테스트를 위한 설정
// 관련 파일: __tests__/components/signup-form.test.tsx, __tests__/actions/auth.test.ts

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공
  dir: './',
})

// Jest에 전달할 커스텀 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig는 next/jest가 비동기적으로 Next.js 구성을 로드할 수 있도록 하는 함수입니다
module.exports = createJestConfig(customJestConfig)