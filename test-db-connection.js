// test-db-connection.js
// 데이터베이스 연결 테스트 스크립트

const postgres = require('postgres');
const path = require('path');
const fs = require('fs');

// .env.local 파일 로드
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // 따옴표 제거
          process.env[key] = value;
        }
      }
    });
  }
}

// 환경 변수 로드
loadEnvFile();

async function testConnection() {
  try {
    console.log('데이터베이스 연결 테스트 시작...');
    
    const connectionString = process.env.DATABASE_URL;
    console.log('연결 문자열:', connectionString ? '설정됨' : '설정되지 않음');
    
    if (!connectionString) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const client = postgres(connectionString, {
      prepare: false,
    });
    
    console.log('PostgreSQL 클라이언트 생성 완료');
    
    // 간단한 쿼리 실행
    const result = await client`SELECT NOW() as current_time`;
    console.log('데이터베이스 연결 성공!');
    console.log('현재 시간:', result[0].current_time);
    
    await client.end();
    console.log('연결 종료 완료');
    
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error.message);
    console.error('전체 에러:', error);
  }
}

testConnection();

