import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './auth';
import type { Service, Unit } from './types';

export interface ProviderMe {
  id: string;
  code: string;
  phone: string;
  displayName: string;
  personName: string;
  initials: string;
  about: string;
  photoUrl: string | null;
  coverUrl: string | null;
  areaName: string;
  city: string;
  radiusKm: number;
  languages: string[];
  yearsExperience: number;
  workingHoursLabel: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  verification: 'PENDING' | 'REUPLOAD' | 'VERIFIED' | 'REJECTED';
  rejectReason: string | null;
  suspendReason: string | null;
  onboardingStep: number;
  categories: { id: string; name: string; groupId: string; unit: Unit; minRate: number; maxRate: number; defaultRate: number }[];
  services: Service[];
  availability: Record<string, number[]>;
  availabilitySummary: { workingDays: string[]; daysLabel: string; hoursLabel: string };
  portfolio: { id: string; imageUrl: string; caption: string }[];
  documents: { id: string; type: string; status: string; note?: string; fileUrl?: string }[];
  bank: { type: 'UPI' | 'BANK'; upiId?: string; accountLast4?: string; ifsc?: string; holderName?: string; verified: boolean } | null;
  stats: { ratingAvg: number; ratingCount: number; jobsCompleted: number; acceptanceRate: number; profileViews: number; strikes: number };
  limits: { maxCategories: number; maxServicesPerCategory: number };
}

export function useProviderMe() {
  const { me } = useAuth();
  return useQuery({ queryKey: ['provider-me'], queryFn: () => api<ProviderMe>('/provider/me'), enabled: me?.role === 'PROVIDER' });
}

/** Updates the cached provider profile after a mutation that returns it. */
export function useSetProviderMe() {
  const qc = useQueryClient();
  return (p: ProviderMe) => qc.setQueryData(['provider-me'], p);
}

export const WEEK = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
] as const;

/** Step size for the rate stepper: ₹50 for hourly, ₹500 for day rates. */
export function rateStep(unit: Unit) {
  return unit === 'DAY' ? 50000 : 5000;
}

/** Category min/max expressed in the service's own unit (8 h = 1 day). */
export function rateBounds(cat: { unit: Unit; minRate: number; maxRate: number } | undefined, unit: Unit) {
  if (!cat) return { min: 10000, max: 10_000_000 };
  const f = unit === cat.unit ? 1 : unit === 'DAY' ? 8 : 1 / 8;
  return { min: Math.round(cat.minRate * f), max: Math.round(cat.maxRate * f) };
}
