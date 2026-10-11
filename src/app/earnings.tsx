import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Card, Empty, ErrorState, H, Kicker, Loading, Pill, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { dateLabel, money } from '@/lib/format';
import { useProviderMe } from '@/lib/provider';
import { c, radius } from '@/lib/theme';

interface Earnings {
  total: number;
  thisMonth: number;
  pending: number;
  paidOut: number;
  bars: { label: string; amount: number }[];
  rows: { bookingId: string; code: string; customerName: string; serviceName: string; dateKey: string; amount: number; payState: string }[];
  payouts: { id: string; code: string; batch: string; amount: number; status: string; paidAt: string | null }[];
}

const PAY: Record<string, [string, string]> = {
  AWAITING: ['Awaiting payment', c.a700],
  PAID: ['In next payout', c.g700],
  PAID_OUT: ['Paid out', c.n600],
  ON_HOLD: ['On hold (dispute)', c.danger],
};
const PAYOUT_TONE: Record<string, [string, string]> = {
  SCHEDULED: ['Scheduled', 'blue'],
  PROCESSING: ['Processing', 'amber'],
  PAID: ['Paid', 'green'],
  FAILED: ['Failed', 'red'],
  ON_HOLD: ['On hold', 'grey'],
};

export default function EarningsScreen() {
  const { data: p } = useProviderMe();
  const { data: e, isLoading, error, refetch, isRefetching } = useQuery({ queryKey: ['earnings'], queryFn: () => api<Earnings>('/provider/earnings') });
  if (isLoading) return <Screen><Loading /></Screen>;
  if (error || !e) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;
  const max = Math.max(1, ...e.bars.map((b) => b.amount));

  return (
    <Screen>
      <TopBar title="Earnings" subtitle="Paid and pending" />
      <Scroll contentStyle={{ paddingTop: 10 }} refreshing={isRefetching} onRefresh={refetch}>
        <View style={{ backgroundColor: c.g200, borderRadius: radius.lg, padding: 18 }}>
          <T w="heavy" size={11.5} color={c.g900} style={{ letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.75 }}>Total earned</T>
          <H size={36} style={{ color: c.g900, marginTop: 4 }}>{money(e.total)}</H>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
            {[
              [money(e.thisMonth), 'This month'],
              [money(e.pending), 'Awaiting payment'],
              [money(e.paidOut), 'Paid out'],
            ].map(([v, k]) => (
              <View key={k}>
                <T w="heavy" size={15} color={c.g900}>{v}</T>
                <T size={11} color={c.g900} style={{ opacity: 0.75 }}>{k}</T>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 20, marginHorizontal: 2 }}>
          {e.bars.map((b, i) => (
            <View key={b.label} style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <T size={9.5} color={c.n600}>{b.amount ? money(b.amount) : ''}</T>
              <View style={{ width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === e.bars.length - 1 ? c.a600 : c.g600, height: `${Math.max(5, Math.round((b.amount / max) * 70))}%` }} />
              <T size={10} color={c.n600}>{b.label}</T>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14, backgroundColor: c.n100, borderRadius: radius.md, padding: 13 }}>
          <T size={12.5} color={c.n700} style={{ lineHeight: 18 }}>
            Payouts go out every Monday to {p?.bank ? (p.bank.type === 'UPI' ? p.bank.upiId : `bank ••${p.bank.accountLast4}`) : 'your UPI ID — add one under Profile → Portfolio, documents & payouts'}. You receive the job amount minus 15% commission and GST on it.
          </T>
        </View>

        {!!e.payouts.length && (
          <>
            <Kicker>Payouts</Kicker>
            <View style={{ gap: 9 }}>
              {e.payouts.map((x) => {
                const [label, tone] = PAYOUT_TONE[x.status] ?? [x.status, 'grey'];
                return (
                  <Card key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                    <View style={{ flex: 1 }}>
                      <T w="heavy" size={13.5}>{x.code}</T>
                      <T size={11.5} color={c.n700}>{x.batch}{x.paidAt ? ` · ${dateLabel(new Date(new Date(x.paidAt).getTime() + 330 * 60_000).toISOString().slice(0, 10))}` : ''}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <T w="heavy" size={14}>{money(x.amount, { decimals: true })}</T>
                      <Pill label={label} toneKey={tone} size="sm" />
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}

        <Kicker>Payment history</Kicker>
        {!e.rows.length ? (
          <Empty glyph="₹" title="No earnings yet" line="Completed jobs show up here once the customer pays." />
        ) : (
          <View style={{ gap: 9 }}>
            {e.rows.map((r) => {
              const [label, color] = PAY[r.payState] ?? [r.payState, c.n600];
              return (
                <Card key={r.bookingId} onPress={() => router.push(`/booking/${r.bookingId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="heavy" size={13.5} numberOfLines={1}>{r.customerName}</T>
                    <T size={11.5} color={c.n700} numberOfLines={1}>{r.serviceName} · {dateLabel(r.dateKey)}</T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T w="heavy" size={14}>{money(r.amount, { decimals: true })}</T>
                    <T w="bold" size={10.5} color={color}>{label}</T>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </Scroll>
    </Screen>
  );
}
