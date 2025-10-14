// __tests__/components/notes/save-status.test.tsx
// 저장 상태 컴포넌트 테스트 - SaveStatusComponent 렌더링 및 상태 표시 검증
// AI 메모장 프로젝트의 저장 상태 UI 테스트

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SaveStatusComponent } from '@/components/notes/save-status';
import { SaveStatus } from '@/lib/hooks/useAutoSave';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2분 전'),
}));

describe('SaveStatusComponent', () => {
  it('idle 상태를 올바르게 렌더링한다', () => {
    const status: SaveStatus = { status: 'idle' };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장되지 않음')).toBeInTheDocument();
  });

  it('saving 상태를 올바르게 렌더링한다', () => {
    const status: SaveStatus = { status: 'saving' };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loader2 아이콘
  });

  it('saved 상태를 올바르게 렌더링한다', () => {
    const lastSaved = new Date('2024-01-14T10:00:00Z');
    const status: SaveStatus = { status: 'saved', lastSaved };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장됨 (2분 전)')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Check 아이콘
  });

  it('saved 상태에서 lastSaved가 없을 때 올바르게 렌더링한다', () => {
    const status: SaveStatus = { status: 'saved' };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장됨')).toBeInTheDocument();
  });

  it('error 상태를 올바르게 렌더링한다', () => {
    const status: SaveStatus = { 
      status: 'error', 
      error: '저장 실패' 
    };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장 실패')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // AlertCircle 아이콘
  });

  it('error 상태에서 error가 없을 때 기본 메시지를 표시한다', () => {
    const status: SaveStatus = { status: 'error' };
    
    render(<SaveStatusComponent status={status} />);
    
    expect(screen.getByText('저장 실패')).toBeInTheDocument();
  });

  it('커스텀 className을 적용한다', () => {
    const status: SaveStatus = { status: 'idle' };
    
    render(<SaveStatusComponent status={status} className="custom-class" />);
    
    const container = screen.getByText('저장되지 않음').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('각 상태에 맞는 색상 클래스를 적용한다', () => {
    const { rerender } = render(<SaveStatusComponent status={{ status: 'saving' }} />);
    expect(screen.getByText('저장 중...')).toHaveClass('text-blue-600');

    rerender(<SaveStatusComponent status={{ status: 'saved' }} />);
    expect(screen.getByText('저장됨')).toHaveClass('text-green-600');

    rerender(<SaveStatusComponent status={{ status: 'error' }} />);
    expect(screen.getByText('저장 실패')).toHaveClass('text-red-600');

    rerender(<SaveStatusComponent status={{ status: 'idle' }} />);
    expect(screen.getByText('저장되지 않음')).toHaveClass('text-gray-500');
  });
});
