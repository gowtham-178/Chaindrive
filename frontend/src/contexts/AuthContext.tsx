import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  LoginInput,
  RegisterInput,
} from '../lib/auth.api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  const { isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await getCurrentUser();
      setUser(res.data.user);
      return res.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    // Don't throw on 401 — user just isn't logged in
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data.data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setUser(data.data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const login = useCallback(
    async (data: LoginInput) => {
      await loginMutation.mutateAsync(data);
    },
    [loginMutation]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      await registerMutation.mutateAsync(data);
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading,
        login,
        logout,
        register,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
