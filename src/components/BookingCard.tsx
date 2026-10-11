import { router } from 'expo-router';
import { View } from 'react-native';
import { money, whenLabel } from '@/lib/format';
import { c } from '@/lib/theme';
import type { Booking } from '@/lib/types';
import { Avatar, Card, Img, Pill, T } from './ui';

/** Customer-side card: what's next for this booking, in one line. */
export function nextStepLine(b: Booking): string | null {
  if (b.actions.includes('pay')) return `Pay ${money(b.pricing.customerTotal, { decimals: true })} now`;
  if (b.actions.includes('review')) return 'Rate your pro to close the booking';
  if (b.status === 'REQUESTED') return 'Waiting for the provider to accept';
  if (b.unread) return `${b.unread} new message${b.unread > 1 ? 's' : ''}`;
  return null;
}

export function BookingCard({ b, viewer }: { b: Booking; viewer: 'CUSTOMER' | 'PROVIDER' }) {
  const line = viewer === 'CUSTOMER' ? nextStepLine(b) : null;
  const amount = viewer === 'PROVIDER' ? b.pricing.providerPayout ?? b.pricing.serviceAmount : b.pricing.customerTotal;
  return (
    <Card onPress={() => router.push(`/booking/${b.id}`)} style={{ padding: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        {viewer === 'CUSTOMER' ? (
          <Img uri={b.provider?.photoUrl} radius={14} style={{ width: 48, height: 48 }} />
        ) : (
          <Avatar name={b.customer?.name} size={46} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="heavy" size={14.5} numberOfLines={1}>{viewer === 'CUSTOMER' ? b.serviceName : b.customer?.name}</T>
          <T size={12.5} color={c.n700} numberOfLines={1}>{viewer === 'CUSTOMER' ? b.provider?.name : b.serviceName}</T>
        </View>
        <Pill label={b.statusLabel} toneKey={b.statusTone} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.divider }}>
        <T size={12.5} color={c.n700}>{whenLabel(b.dateKey, b.startHour)}{viewer === 'PROVIDER' ? ` · ${b.durationLabel}` : ''}</T>
        <T w="heavy" size={14} color={c.a700}>{money(amount, { decimals: true })}</T>
      </View>
      {viewer === 'PROVIDER' && !!b.note && (
        <View style={{ marginTop: 10, backgroundColor: c.bg, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
          <T size={12.5} color={c.n800} numberOfLines={3}>{b.note}</T>
        </View>
      )}
      {!!line && <T w="bold" size={12} color={c.g700} style={{ marginTop: 10 }}>{line}</T>}
    </Card>
  );
}
