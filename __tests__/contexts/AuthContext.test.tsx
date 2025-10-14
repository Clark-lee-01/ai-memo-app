// __tests__/contexts/AuthContext.test.tsx
// AuthContext 테스트 - 인증 컨텍스트 테스트
// AI 메모장 프로젝트의 인증 컨텍스트 테스트

import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import React from 'react';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
};

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;

// 테스트용 컴포넌트
function TestComponent() {
  const { user, loading, authState } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (authState === 'authenticated') return <div>Welcome, {user?.email}</div>;
  return <div>Not authenticated</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockCreateBrowserClient.mockReturnValue(mockSupabase as any);
    jest.clearAllMocks();
  });

  it('should provide loading state initially', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should provide authenticated state when user is logged in', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument();
    });
  });

  it('should provide unauthenticated state when user is not logged in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('should handle auth state changes', async () => {
    let authStateChangeCallback: any;
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    // 인증 상태 변경 시뮬레이션
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    act(() => {
      authStateChangeCallback('SIGNED_IN', { user: mockUser });
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument();
    });
  });

  it('should throw error when used outside AuthProvider', () => {
    // 에러를 캐치하기 위한 콘솔 에러 억제
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth는 AuthProvider 내에서 사용되어야 합니다');

    consoleSpy.mockRestore();
  });
});
