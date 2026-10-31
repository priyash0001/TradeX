'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'BUYER' | 'MANUFACTURER' | 'VENDOR' | string;
  companyName?: string | null;
  location?: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  unreadCount: number;
  login: (userData: UserSession) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: UserSession | null;
}) {
  const [user, setUser] = useState<UserSession | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread notifications whenever a user is authenticated
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Non-critical, ignore error
    }
  }, []);

  // Check auth from /api/auth/me if no initialUser was provided
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.user) {
          fetchNotifications();
        } else {
          setUnreadCount(0);
        }
      } else {
        setUser(null);
        setUnreadCount(0);
      }
    } catch {
      // Keep existing user state if network error occurs
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const initialUserId = initialUser?.id;

  useEffect(() => {
    if (initialUser) {
      setUser((prev) => (prev?.id === initialUser.id ? prev : initialUser));
      fetchNotifications();
    } else {
      // Verify once on client mount if no initial user
      refreshUser();
    }
  }, [initialUserId, fetchNotifications, refreshUser]);

  const login = useCallback(
    (userData: UserSession) => {
      setUser(userData);
      fetchNotifications();
    },
    [fetchNotifications]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setUnreadCount(0);
    window.location.href = '/login';
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      unreadCount,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, unreadCount, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
