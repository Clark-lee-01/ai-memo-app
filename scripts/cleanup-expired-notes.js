// scripts/cleanup-expired-notes.js
// 30일 경과 노트 자동 정리 스크립트
// AI 메모장 프로젝트의 자동 정리 크론잡

const { exec } = require('child_process');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanupExpiredNotes() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiToken = process.env.CLEANUP_API_TOKEN;

  try {
    console.log(`[${new Date().toISOString()}] 자동 정리 작업 시작...`);

    const response = await fetch(`${baseUrl}/api/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log(`[${new Date().toISOString()}] 자동 정리 완료: ${result.message}`);
    } else {
      console.error(`[${new Date().toISOString()}] 자동 정리 실패:`, result.error);
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 자동 정리 에러:`, error.message);
  }
}

// 스크립트 실행
cleanupExpiredNotes();
