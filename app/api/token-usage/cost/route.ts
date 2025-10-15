// app/api/token-usage/cost/route.ts
// 토큰 비용 관리 API 엔드포인트
// API 비용 계산, 예측, 최적화 제안을 제공
// 관련 파일: components/cost/token-cost-management.tsx, lib/monitoring/tokenMonitor.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { tokenMonitor } from '@/lib/monitoring/tokenMonitor';

// Gemini API 비용 (2024년 기준)
const GEMINI_COST_PER_INPUT_TOKEN = 0.0000005; // $0.50 per 1M tokens
const GEMINI_COST_PER_OUTPUT_TOKEN = 0.0000015; // $1.50 per 1M tokens

// GET /api/token-usage/cost - 비용 데이터 조회
export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await createServerClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || user.id;
    
    // 관리자 권한 확인 (다른 사용자 데이터 조회 시)
    const isAdmin = user.email?.endsWith('@admin.com') || user.email === 'admin@example.com';
    const canViewUserData = targetUserId === user.id || isAdmin;
    
    if (!canViewUserData) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 토큰 사용량 데이터 조회
    const usage = tokenMonitor.getUsage(targetUserId);
    const stats = tokenMonitor['store'].getUsageStats(targetUserId, 30);
    
    // 비용 계산
    const costData = calculateCostData(usage, stats);
    
    return NextResponse.json(costData);
  } catch (error) {
    console.error('토큰 비용 조회 오류:', error);
    
    return NextResponse.json(
      { error: '비용 데이터를 조회할 수 없습니다' },
      { status: 500 }
    );
  }
}

// 비용 데이터 계산
function calculateCostData(usage: { daily: number; hourly: number; limits: { daily: number }; stats: { totalUsage: number; averageDaily: number } }, stats: { totalUsage: number; averageDaily: number; peakHourly: number; operations: { [key: string]: number } }) {
  // 현재 비용 계산 (이번 달)
  const currentMonthUsage = usage.daily * 30; // 대략적인 월간 사용량
  const inputCost = currentMonthUsage * GEMINI_COST_PER_INPUT_TOKEN;
  const outputCost = currentMonthUsage * GEMINI_COST_PER_OUTPUT_TOKEN;
  const currentCost = inputCost + outputCost;
  
  // 예상 비용 계산 (다음 달)
  const projectedUsage = stats.averageDaily * 30;
  const projectedInputCost = projectedUsage * GEMINI_COST_PER_INPUT_TOKEN;
  const projectedOutputCost = projectedUsage * GEMINI_COST_PER_OUTPUT_TOKEN;
  const projectedCost = projectedInputCost + projectedOutputCost;
  
  // 토큰당 평균 비용
  const totalTokens = stats.totalUsage;
  const costPerToken = totalTokens > 0 ? currentCost / totalTokens : 0;
  
  // 비용 세부 분석
  const costBreakdown = {
    input: inputCost,
    output: outputCost,
    total: currentCost,
  };
  
  // 최적화 제안 생성
  const optimizationSuggestions = generateOptimizationSuggestions(usage, stats);
  
  // 비용 트렌드 생성 (최근 7일)
  const costTrend = generateCostTrend();
  
  return {
    currentCost,
    projectedCost,
    costPerToken,
    costBreakdown,
    optimizationSuggestions,
    costTrend,
  };
}

// 최적화 제안 생성
function generateOptimizationSuggestions(usage: { daily: number; hourly: number; limits: { daily: number }; stats: { totalUsage: number; averageDaily: number } }, stats: { totalUsage: number; averageDaily: number; peakHourly: number; operations: { [key: string]: number } }) {
  const suggestions = [];
  
  // 사용량이 높은 경우
  if (usage.daily > usage.limits.daily * 0.8) {
    suggestions.push({
      type: 'reduce',
      title: '사용량 줄이기',
      description: '일일 사용량이 80%를 초과했습니다. 불필요한 요청을 줄여보세요.',
      potentialSavings: usage.daily * 0.1 * GEMINI_COST_PER_INPUT_TOKEN,
      priority: 'high',
    });
  }
  
  // 요청당 토큰이 많은 경우
  if (stats.peakHourly > usage.daily * 0.9) {
    suggestions.push({
      type: 'optimize',
      title: '요청 최적화',
      description: '시간당 사용량이 높습니다. 요청을 분산하여 처리해보세요.',
      potentialSavings: stats.peakHourly * 0.2 * GEMINI_COST_PER_INPUT_TOKEN,
      priority: 'medium',
    });
  }
  
  // 특정 작업 유형이 많은 경우
  const topOperation = Object.entries(stats.operations)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topOperation && topOperation[1] > stats.totalUsage * 0.5) {
    suggestions.push({
      type: 'schedule',
      title: '작업 스케줄링',
      description: `${topOperation[0]} 작업이 전체 사용량의 50%를 차지합니다. 작업을 스케줄링해보세요.`,
      potentialSavings: topOperation[1] * 0.15 * GEMINI_COST_PER_INPUT_TOKEN,
      priority: 'medium',
    });
  }
  
  // 일반적인 최적화 제안
  suggestions.push({
    type: 'optimize',
    title: '캐싱 활용',
    description: '동일한 요청에 대해 캐싱을 활용하여 중복 요청을 줄이세요.',
    potentialSavings: stats.totalUsage * 0.1 * GEMINI_COST_PER_INPUT_TOKEN,
    priority: 'low',
  });
  
  return suggestions;
}

// 비용 트렌드 생성
function generateCostTrend() {
  const trend = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 임시 데이터 (실제 환경에서는 데이터베이스에서 조회)
    const baseCost = 10 + Math.random() * 20;
    const cost = baseCost + (Math.random() - 0.5) * 5;
    
    trend.push({
      date: date.toISOString().split('T')[0],
      cost: Math.max(0, cost),
    });
  }
  
  return trend;
}
