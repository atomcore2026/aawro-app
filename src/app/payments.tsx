import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Card, Empty, ErrorState, Loading, Pill, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { dateLabel, money } from '@/lib/format';
import { c } from '@/lib/theme';

interface Payment {
  id: string;
  code: string;
  status: string;
  amount: number;
  method: string;
  createdAt: string;
  booking: { id: string; code: string; serviceName: string; dateKey: string } | null;
}

const TONE: Record<string, [string, string]> = {
  CAPTURED: ['Paid', 'green'],
  FAILED: ['Failed', 'red'],
  REFUNDED: ['Refunded', 'grey'],
  PARTIALLY_REFUNDED: ['Part refunded', 'grey'],
  CREATED: ['Started', 'blue'],
};

export default function Payments() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({ queryKey: ['payments'], queryFn: () => api<Payment[]>('/me/payments') });
  const paid = (data ?? []).filter((p) => p.status === 'CAPTURED' || p.status === 'PARTIALLY_REFUNDED').reduce((s, p) => s + p.amount, 0);
  return (
    <Screen>
      <TopBar title="Payment history" subtitle={data ? `${money(paid)} paid on AAWRO` : undefined} large />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 10, gap: 9 }}>
          {!data!.length && <Empty glyph="₹" title="No payments yet" line="You pay after each job is done. Receipts appear here." />}
          {data!.map((p) => {
            const [label, tone] = TONE[p.status] ?? [p.status, 'grey'];
            return (
              <Card key={p.id} onPress={p.booking ? () => router.push(`/booking/${p.booking!.id}`) : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="heavy" size={13.5} numberOfLines={1}>{p.booking?.serviceName ?? p.code}</T>
                  <T size={11.5} color={c.n700}>{p.code} · {p.method ?? '—'} · {dateLabel(new Date(new Date(p.createdAt).getTime() + 330 * 60_000).toISOString().slice(0, 10))}</T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <T w="heavy" size={14}>{money(p.amount, { decimals: true })}</T>
                  <Pill label={label} toneKey={tone} size="sm" />
                </View>
              </Card>
            );
          })}
        </Scroll>
      )}
    </Screen>
  );
}
