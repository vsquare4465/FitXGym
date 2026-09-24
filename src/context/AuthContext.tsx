import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setToken, getToken } from '../api/client';
import { AdminPermissions, AdminModule, canAccess } from '../lib/adminPermissions';

export type AuthUser =
  | {
      role: 'admin';
      id: string;
      name: string;
      email: string;
      adminRole: 'OWNER' | 'RECEPTION' | 'TRAINER';
      jobTitle?: string | null;
      permissions: AdminPermissions;
    }
  | { role: 'member'; name: string; email: string; memberId: string };

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginMember: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (mod: AdminModule, level?: 'read' | 'write') => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u as AuthUser);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginAdmin = async (email: string, password: string) => {
    const res = await authApi.loginAdmin(email, password);
    setToken(res.token);
    setUser(res.user);
  };

  const loginMember = async (email: string, password: string) => {
    const res = await authApi.loginMember(email, password);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  const can = (mod: AdminModule, level: 'read' | 'write' = 'read') => {
    if (!user || user.role !== 'admin') return false;
    return canAccess(user.permissions, mod, level);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginMember, logout, refreshUser: refresh, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
