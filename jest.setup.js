// jest.setup.js
// Jest 테스트 설정 파일
// 테스트 환경에서 사용할 전역 설정
// 관련 파일: jest.config.js, __tests__/components/signup-form.test.tsx

import '@testing-library/jest-dom'

// TextEncoder/TextDecoder polyfill for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}