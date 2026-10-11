import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Avatar, Btn, Footer, H, Kicker, Loading, Row, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { agoLong, money } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { c, radius, shadow } from '@/lib/theme';

interface Order {
  mode: 'MOCK' | 'RAZORPAY';
  orderId: string;
  amount: number;
  breakdown: { booking: number; dueFees: number };
  checkoutUrl: string;
  returnUrl: string;
}

const GLYPH: Record<string, [string, string]> = { UPI: ['₹', c.g200], CARD: ['▤', c.a200], NETBANKING: ['🏦', c.n300], WALLET: ['◎', c.a300] };

/** Pay after service. Test gateway confirms in-app; Razorpay opens hosted checkout. */
export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, refreshMe } = useAuth();
  const qc = useQueryClient();
  const { data: b, refetch } = useBooking(id);
  const methods = useQuery({ queryKey: ['pay-methods'], queryFn: () => api<{ mode: string; methods: { id: string; label: string; sub: string }[] }>('/payments/methods') });
  const [method, setMethod] = useState('UPI');
  const [state, setState] = useState<'idle' | 'processing' | 'failed' | 'done'>('idle');
  const [failMsg, setFailMsg] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  if (!b) return <Screen><Loading /></Screen>;
  const due = me?.dueAmount ?? 0;
  const total = (order?.amount ?? b.pricing.customerTotal + due);

  const pay = async (simulateFailure = false) => {
    setState('processing');
    try {
      const o = await api<Order>(`/bookings/${id}/pay`, { body: { method } });
      setOrder(o);
      if (o.mode === 'MOCK') {
        await new Promise((r) => setTimeout(r, 1200));
        const r = await api<{ status: string; failReason?: string }>(`/payments/${o.orderId}/test-complete`, { body: { success: !simulateFailure } });
        if (r.status !== 'CAPTURED') throw new ApiError(402, 'PAYMENT_FAILED', r.failReason ?? 'Payment failed');
      } else {
        await WebBrowser.openAuthSessionAsync(o.checkoutUrl, o.returnUrl);
        const fresh = await refetch();
        if (fresh.data?.status !== 'PAID' && fresh.data?.paymentStatus !== 'PAID') throw new ApiError(402, 'PAYMENT_FAILED', 'Payment was not completed. Nothing was charged.');
      }
      await qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      refreshMe();
      setState('done');
    } catch (e) {
      setFailMsg(e instanceof ApiError ? e.message : 'Your bank declined the request. Nothing was charged.');
      setState('failed');
    }
  };

  const rows: [string, string][] = [
    ['Service amount', money(b.pricing.serviceAmount)],
    ['Convenience fee', money(b.pricing.convenienceFee)],
    ['GST on fee', money(b.pricing.convenienceGst, { decimals: true })],
  ];
  if (b.pricing.discount) rows.push(['Coupon', `−${money(b.pricing.discount)}`]);
  if (due) rows.push(['Pending cancellation fee', money(due)]);

  const methodLabel = methods.data?.methods.find((m) => m.id === method)?.label ?? method;

  return (
    <Screen>
      <TopBar title="Payment" subtitle={b.completedAt ? `Service completed ${agoLong(b.completedAt)}` : undefined} back={state !== 'processing'} />
      <Scroll contentStyle={{ paddingTop: 8 }}>
        {state === 'idle' && (
          <>
            <View style={[{ backgroundColor: c.n100, borderRadius: radius.lg, padding: 16 }, shadow.sm]}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: c.divider }}>
                <Avatar uri={b.provider?.photoUrl} name={b.provider?.name} size={46} rounded={false} />
                <View style={{ flex: 1 }}>
                  <T w="heavy" size={14.5}>{b.provider?.name}</T>
                  <T size={12} color={c.n600}>{b.serviceName} · {b.durationLabel}</T>
                </View>
              </View>
              {rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 13 }}>
                <T w="heavy" size={14}>Total payable</T>
                <H size={26} style={{ color: c.a700 }}>{money(total, { decimals: true })}</H>
              </View>
            </View>
            <Kicker>Pay with</Kicker>
            <View style={{ gap: 9 }}>
              {(methods.data?.methods ?? []).map((m) => {
                const on = method === m.id;
                const [glyph, toneBg] = GLYPH[m.id] ?? ['•', c.n300];
                return (
                  <Pressable key={m.id} onPress={() => setMethod(m.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.n100, borderWidth: 1.5, borderColor: on ? c.accent : c.n300, borderRadius: radius.md, padding: 14 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: toneBg, alignItems: 'center', justifyContent: 'center' }}>
                      <T size={17}>{glyph}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T w="bold" size={14}>{m.label}</T>
                      <T size={11.5} color={c.n600}>{m.sub}</T>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: on ? c.accent : c.n300, backgroundColor: on ? c.accent : 'transparent' }} />
                  </Pressable>
                );
              })}
            </View>
            {methods.data?.mode === 'MOCK' && (
              <View style={{ marginTop: 14, backgroundColor: c.a100, borderRadius: radius.md, padding: 13 }}>
                <T size={12} color={c.a900}>Test mode: no real money moves. Add Razorpay keys on the server for live payments.</T>
                <Pressable onPress={() => pay(true)} style={{ marginTop: 6 }}>
                  <T w="bold" size={12} color={c.a700}>Simulate a failed payment</T>
                </Pressable>
              </View>
            )}
          </>
        )}
        {state === 'processing' && (
          <View style={{ alignItems: 'center', paddingVertical: 90, paddingHorizontal: 20 }}>
            <ActivityIndicator size="large" color={c.accent} />
            <H size={22} style={{ marginTop: 24, marginBottom: 6 }}>Processing {money(total, { decimals: true })}</H>
            <T size={13.5} color={c.n700}>Do not close the app.</T>
          </View>
        )}
        {state === 'failed' && (
          <View style={{ alignItems: 'center', paddingVertical: 70, paddingHorizontal: 16 }}>
            <View style={{ width: 84, height: 84, borderRadius: 999, backgroundColor: c.a200, alignItems: 'center', justifyContent: 'center' }}>
              <T size={34}>⚠</T>
            </View>
            <H size={23} style={{ marginTop: 20, marginBottom: 6 }}>Payment failed</H>
            <T size={13.5} color={c.n700} style={{ textAlign: 'center', maxWidth: 255, marginBottom: 20 }}>{failMsg}</T>
            <Btn label="Try again" onPress={() => setState('idle')} style={{ paddingHorizontal: 26 }} />
          </View>
        )}
        {state === 'done' && (
          <View style={{ alignItems: 'center', paddingTop: 56, paddingBottom: 20 }}>
            <View style={{ width: 92, height: 92, borderRadius: 999, backgroundColor: c.g300, alignItems: 'center', justifyContent: 'center' }}>
              <T size={40} color={c.g900}>✓</T>
            </View>
            <H size={26} style={{ marginTop: 20, marginBottom: 4 }}>Payment successful</H>
            <T size={13.5} color={c.n700} style={{ marginBottom: 20 }}>{money(total, { decimals: true })} paid to {b.provider?.name}</T>
            <View style={{ backgroundColor: c.n100, borderRadius: radius.lg, padding: 16, alignSelf: 'stretch' }}>
              <T w="heavy" size={11} color={c.n600} style={{ letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Receipt {b.code}</T>
              {rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 11 }}>
                <T w="heavy" size={13}>Paid via {methodLabel}</T>
                <T w="heavy" size={14}>{money(total, { decimals: true })}</T>
              </View>
            </View>
          </View>
        )}
      </Scroll>
      {state === 'idle' && (
        <Footer>
          <Btn label={`Pay ${money(total, { decimals: true })}`} size="lg" onPress={() => pay(false)} />
        </Footer>
      )}
      {state === 'done' && (
        <Footer>
          <Btn label={`Rate ${b.provider?.person?.split(' ')[0] ?? 'your pro'}`} size="lg" onPress={() => router.replace(`/review/${b.id}`)} />
        </Footer>
      )}
    </Screen>
  );
}
