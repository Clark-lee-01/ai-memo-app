// __tests__/hooks/useAuth.test.ts
// useAuth 훅 테스트 - 인증 상태 관리 테스트
// AI 메모장 프로젝트의 인증 훅 테스트

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthProvider } from '@/lib/contexts/AuthContext';
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

describe('useAuth', () => {
  beforeEach(() => {
    mockCreateBrowserClient.mockReturnValue(mockSupabase as any);
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.authState).toBe('loading');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return authenticated state when user is logged in', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      onboarding_completed: true,
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // 초기 로딩 완료를 기다림
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.authState).toBe('authenticated');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isOnboardingCompleted).toBe(true);
  });

  it('should return unauthenticated state when user is not logged in', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // 초기 로딩 완료를 기다림
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.authState).toBe('unauthenticated');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isOnboardingCompleted).toBe(false);
  });

  it('should handle signOut', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle refreshSession', async () => {
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
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
  });
});
