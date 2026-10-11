import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Btn, Field, Footer, H, Kicker, Loading, Row, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateLabel, DURATION_LABEL, hourLabel, money } from '@/lib/format';
import { useProviderProfile } from '@/lib/queries';
import { c, radius, shadow } from '@/lib/theme';
import type { Booking } from '@/lib/types';

interface Quote {
  serviceName: string;
  hours: number;
  pricing: { rate: number; unit: 'HOUR' | 'DAY'; serviceAmount: number; convenienceFee: number; convenienceGst: number; discount: number; customerTotal: number };
  coupon: { code: string; description?: string } | null;
}

export default function Summary() {
  const params = useLocalSearchParams<{ providerId: string; serviceId: string; date: string; startHour: string; duration: string; note?: string }>();
  const { me } = useAuth();
  const qc = useQueryClient();
  const { data: p } = useProviderProfile(params.providerId);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState<string | undefined>();
  const [couponError, setCouponError] = useState<string | null>(null);

  const body = {
    providerServiceId: params.serviceId,
    date: params.date,
    startHour: Number(params.startHour),
    duration: params.duration,
    note: params.note ?? '',
    couponCode: applied,
    addressId: me?.defaultAddress?.id,
  };
  const quote = useQuery({
    queryKey: ['quote', body],
    queryFn: () => api<Quote>('/bookings/quote', { body }),
    retry: false,
  });

  const applyCoupon = async () => {
    setCouponError(null);
    try {
      await api<Quote>('/bookings/quote', { body: { ...body, couponCode: coupon.trim() } });
      setApplied(coupon.trim().toUpperCase());
    } catch (e) {
      setCouponError(e instanceof ApiError ? e.message : 'Coupon not valid');
    }
  };

  const send = useMutation({
    mutationFn: () => api<Booking>('/bookings', { body }),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.replace({ pathname: '/book/sent', params: { id: b.id } });
    },
  });

  const q = quote.data;
  const addr = me?.defaultAddress;
  const rows: [string, string][] = q
    ? [
        ['Service', q.serviceName],
        ['Date', dateLabel(params.date)],
        ['Time', hourLabel(Number(params.startHour), false)],
        ['Duration', DURATION_LABEL[params.duration] + (params.duration === 'HALF' ? ' (4h)' : params.duration === 'FULL' && q.pricing.unit === 'HOUR' ? ' (8h)' : '')],
        ['Address', addr ? `${addr.line1}, ${addr.areaName || addr.line2}` : 'Add an address'],
        ['Rate', `${money(q.pricing.rate)} ${q.pricing.unit === 'DAY' ? 'per day' : 'per hour'}`],
      ]
    : [];
  const math =
    q && (q.pricing.unit === 'HOUR' ? `${money(q.pricing.rate)}/hour × ${q.hours} hours` : params.duration === 'HALF' ? `60% of the ${money(q.pricing.rate)} day rate` : `${money(q.pricing.rate)} day rate`);

  return (
    <Screen>
      <TopBar title="Booking summary" subtitle="Review before sending" />
      {quote.isLoading ? (
        <Loading />
      ) : quote.error ? (
        <View style={{ padding: 24 }}>
          <T size={14} color={c.danger}>{(quote.error as Error).message}</T>
          <Btn label="Pick another time" variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <Scroll contentStyle={{ paddingTop: 8 }}>
          {me?.paymentHold && (
            <Pressable onPress={() => router.push('/(customer)/bookings')} style={{ backgroundColor: '#fee2e2', borderRadius: radius.md, padding: 14, marginBottom: 14 }}>
              <T w="heavy" size={13.5} color="#991b1b">Clear your pending payment first</T>
              <T size={12.5} color="#7f1d1d" style={{ marginTop: 3 }}>A completed job is still unpaid, so new requests are paused. Tap to open your bookings and pay.</T>
            </Pressable>
          )}
          <View style={[{ backgroundColor: c.n100, borderRadius: radius.lg, padding: 16 }, shadow.sm]}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Avatar name={p?.person || p?.name} size={50} rounded={false} bg={c.a300} fg={c.a900} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="heavy" size={15}>{p?.name}</T>
                <T size={12} color={c.n600}>{p?.areaName}</T>
              </View>
            </View>
            {rows.map(([k, v]) => (
              <Row key={k} k={k} v={v} />
            ))}
            <Row k="Service amount" v={money(q!.pricing.serviceAmount)} />
            <Row k="Convenience fee + GST" v={money(q!.pricing.convenienceFee + q!.pricing.convenienceGst, { decimals: true })} />
            {!!q!.pricing.discount && <Row k={`Coupon ${applied}`} v={`−${money(q!.pricing.discount)}`} />}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14 }}>
              <T w="bold" size={14}>Estimated total</T>
              <H size={26} style={{ color: c.a700 }}>{money(q!.pricing.customerTotal, { decimals: true })}</H>
            </View>
            <T size={11.5} color={c.n600} style={{ marginTop: 6 }}>{math}. Payment happens after the service is completed.</T>
          </View>

          <View style={{ backgroundColor: c.g100, borderRadius: radius.md, padding: 14, marginTop: 14 }}>
            <T size={12.5} color={c.g900} style={{ lineHeight: 19 }}>This is a request, not a confirmation. {p?.person} has to accept it — the slot stays open for others until then.</T>
          </View>

          {!!params.note && (
            <>
              <Kicker style={{ marginTop: 14 }}>Your note</Kicker>
              <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 13 }}>
                <T size={13} style={{ lineHeight: 19 }}>{params.note}</T>
              </View>
            </>
          )}

          <Kicker>Coupon</Kicker>
          {applied ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.g100, borderRadius: radius.md, padding: 13 }}>
              <T w="bold" size={13} color={c.g900}>{applied} applied</T>
              <Pressable onPress={() => setApplied(undefined)}>
                <T w="bold" size={12.5} color={c.a700}>Remove</T>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Field value={coupon} onChangeText={setCoupon} placeholder="e.g. WELCOME100" autoCapitalize="characters" style={{ flex: 1 }} error={couponError ?? undefined} />
              <Btn label="Apply" variant="soft" size="sm" onPress={applyCoupon} disabled={!coupon.trim()} style={{ minHeight: 48 }} />
            </View>
          )}
        </Scroll>
      )}
      <Footer>
        {!!send.error && <T size={13} color={c.danger} style={{ textAlign: 'center' }}>{(send.error as Error).message}</T>}
        <Btn label="Send booking request" size="lg" onPress={() => send.mutate()} loading={send.isPending} disabled={!q || !addr} />
      </Footer>
    </Screen>
  );
}
