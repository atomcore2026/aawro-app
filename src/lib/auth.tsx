import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { api, tokens } from './api';
import { connectSocket, disconnectSocket } from './socket';
import { c } from './theme';

export type Role = 'CUSTOMER' | 'PROVIDER';

export interface Me {
  id: string;
  role: Role;
  phone: string;
  phoneDisplay: string;
  name: string;
  initials: string;
  email: string;
  paymentHold: boolean;
  dueAmount: number;
  addresses: Address[];
  defaultAddress: Address | null;
  locality: string | null;
  stats: { bookings: number; saved: number; reviews: number };
  unreadNotifications: number;
  recentSearches: string[];
  provider: { id: string; code: string; status: string; onboardingStep: number; displayName: string } | null;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  areaName: string;
  pincode: string;
  isDefault: boolean;
}

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  me: Me | null;
  requestOtp: (phone: string, role: Role) => Promise<{ devCode?: string }>;
  verifyOtp: (phone: string, code: string, role: Role, name?: string) => Promise<{ isNew: boolean; me: Me }>;
  refreshMe: () => Promise<Me | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [me, setMe] = useState<Me | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      const m = await api<Me>('/me');
      setMe(m);
      setStatus('signedIn');
      return m;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { refreshToken } = await tokens.load();
    if (refreshToken) api('/auth/logout', { body: { refreshToken }, auth: false }).catch(() => {});
    await tokens.clear();
    disconnectSocket();
    qc.clear();
    setMe(null);
    setStatus('signedOut');
  }, [qc]);

  useEffect(() => {
    tokens.onSignedOut(() => {
      disconnectSocket();
      setMe(null);
      setStatus('signedOut');
    });
    (async () => {
      const { accessToken, refreshToken } = await tokens.load();
      if (!accessToken && !refreshToken) return setStatus('signedOut');
      const m = await refreshMe();
      if (!m) {
        await tokens.clear();
        setStatus('signedOut');
      }
    })();
  }, [refreshMe]);

  // Realtime: connect while signed in and refresh affected queries on events.
  useEffect(() => {
    if (status !== 'signedIn') return;
    connectSocket(qc, refreshMe);
    return () => disconnectSocket();
  }, [status, qc, refreshMe]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      me,
      refreshMe,
      signOut,
      requestOtp: (phone, role) => api('/auth/otp/request', { body: { phone, role }, auth: false }),
      verifyOtp: async (phone, code, role, name) => {
        const r = await api<{ accessToken: string; refreshToken: string; isNew: boolean }>('/auth/otp/verify', {
          body: { phone, code, role, name: name?.trim() || undefined },
          auth: false,
        });
        await tokens.save(r.accessToken, r.refreshToken);
        const m = (await refreshMe())!;
        return { isNew: r.isNew, me: m };
      },
    }),
    [status, me, refreshMe, signOut],
  );

  // Hold rendering until the stored session is loaded, so no screen fires
  // requests without its token (e.g. when opened from a deep link).
  return <Ctx.Provider value={value}>{status === 'loading' ? <View style={{ flex: 1, backgroundColor: c.a100 }} /> : children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
