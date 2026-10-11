import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './auth';
import type { Booking, Notification, ProviderCard, ProviderProfile } from './types';

/** Shared queries used by several screens (and the tab badges). */
export function useConversations() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<any[]>('/conversations'),
    enabled: status === 'signedIn',
  });
}

export function useBookings(tab?: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['bookings', tab ?? 'all'],
    queryFn: () => api<{ items: Booking[]; counts: Record<string, number> }>(`/bookings${tab ? `?tab=${tab}` : ''}`),
    enabled: status === 'signedIn',
  });
}

export function useBooking(id?: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => api<Booking>(`/bookings/${id}`),
    enabled: !!id,
  });
}

export function useNotifications() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ unread: number; items: Notification[] }>('/me/notifications'),
    enabled: status === 'signedIn',
  });
}

export function useUnreadChats() {
  const { data } = useConversations();
  return (data ?? []).filter((c) => c.unread > 0).length;
}

/** Saved (favourite) providers, with an optimistic toggle. */
export function useSaved() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['saved'],
    queryFn: () => api<ProviderCard[]>('/me/saved'),
    enabled: me?.role === 'CUSTOMER',
  });
  const ids = new Set((q.data ?? []).map((p) => p.id));
  const toggle = async (id: string) => {
    const on = !ids.has(id);
    qc.setQueryData<ProviderCard[]>(['saved'], (old = []) => (on ? [...old, { id } as ProviderCard] : old.filter((p) => p.id !== id)));
    try {
      await api(`/me/saved/${id}`, { method: on ? 'PUT' : 'DELETE' });
    } finally {
      qc.invalidateQueries({ queryKey: ['saved'] });
    }
    return on;
  };
  return { ...q, ids, toggle };
}

export function useProviderProfile(id?: string) {
  return useQuery({ queryKey: ['provider', id], queryFn: () => api<ProviderProfile>(`/providers/${id}`), enabled: !!id });
}
