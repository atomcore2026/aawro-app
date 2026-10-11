import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Btn, ErrorState, H, Loading, Screen, Scroll, T } from '@/components/ui';
import { api } from '@/lib/api';
import { dateLabel, hourLabel } from '@/lib/format';
import { useBookings } from '@/lib/queries';
import { c } from '@/lib/theme';

interface Week {
  weekly: Record<string, number[]>;
  week: { date: string; weekday: string; open: number[]; booked: number[]; closed: boolean }[];
}

const LEGEND: [string, string][] = [
  ['Available', c.n300],
  ['Requested', c.a400],
  ['Booked', c.g600],
  ['Closed', c.n500],
];

/** Next 7 days hour by hour: open, requested, booked or closed. */
export default function Calendar() {
  const avail = useQuery({ queryKey: ['availability'], queryFn: () => api<Week>('/provider/availability') });
  const active = useBookings('active');
  const bookings = active.data?.items ?? [];

  if (avail.isLoading) return <Screen><Loading /></Screen>;
  if (avail.error) return <Screen><ErrorState error={avail.error} onRetry={avail.refetch} /></Screen>;

  const days = avail.data!.week.slice(0, 7);
  const locked = bookings.filter((b) => ['ACCEPTED', 'UPCOMING', 'IN_PROGRESS'].includes(b.status)).length;
  const perDay = Math.max(...Object.values(avail.data!.weekly).map((h) => h.length), 0);

  const cellFor = (date: string, h: number, base: number[]) => {
    const bk = bookings.find((b) => b.dateKey === date && h >= b.startHour && h < b.startHour + b.hours && !['DECLINED', 'EXPIRED', 'CANCELLED'].includes(b.status));
    if (bk && bk.status === 'REQUESTED') return { state: 'requested', label: bk.customer?.name.split(' ')[0] ?? 'Request', bk };
    if (bk) return { state: 'booked', label: bk.customer?.name.split(' ')[0] ?? 'Booked', bk };
    if (base.includes(h)) return { state: 'available', label: 'Open', bk: null };
    return { state: 'closed', label: 'Closed', bk: null };
  };
  const STYLE: Record<string, [string, string, string]> = {
    available: [c.n100, c.n700, c.n300],
    requested: [c.a200, c.a900, c.a400],
    booked: [c.g600, '#fff', c.g600],
    closed: [c.n200, c.n500, c.n200],
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <H size={26}>Calendar</H>
          <T size={12.5} color={c.n600} style={{ marginTop: 2 }}>{perDay} hours a day · {locked} locked</T>
        </View>
        <Btn label="Availability" variant="soft" size="sm" onPress={() => router.push('/availability')} style={{ minHeight: 38 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 }}>
        {LEGEND.map(([label, color]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 11, height: 11, borderRadius: 4, backgroundColor: color }} />
            <T w="bold" size={11.5} color={c.n700}>{label}</T>
          </View>
        ))}
      </View>
      <Scroll refreshing={avail.isRefetching || active.isRefetching} onRefresh={() => { avail.refetch(); active.refetch(); }} contentStyle={{ paddingTop: 4 }}>
        {days.map((d) => {
          const base = [...new Set([...(avail.data!.weekly[d.weekday] ?? []), ...d.booked])];
          const hours = [...new Set([...base, ...bookings.filter((b) => b.dateKey === d.date && b.status === 'REQUESTED').flatMap((b) => Array.from({ length: b.hours }, (_, i) => b.startHour + i))])].sort((a, b) => a - b);
          const nBooked = d.booked.length;
          return (
            <View key={d.date} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <T w="heavy" size={14}>{dateLabel(d.date)}</T>
                <T size={11.5} color={c.n600}>{!hours.length ? 'Day off' : `${d.open.length} open · ${nBooked} booked`}</T>
              </View>
              {!hours.length ? (
                <View style={{ backgroundColor: c.n200, borderRadius: 13, padding: 12 }}>
                  <T size={12.5} color={c.n600}>Not working. Change it in Availability.</T>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {hours.map((h) => {
                    const cell = cellFor(d.date, h, base);
                    const [bg, fg, border] = STYLE[cell.state];
                    return (
                      <Pressable key={h} disabled={!cell.bk} onPress={() => cell.bk && router.push(`/booking/${cell.bk.id}`)} style={{ width: '31.5%', borderRadius: 13, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: bg, borderWidth: 1.5, borderColor: border }}>
                        <T w="heavy" size={12.5} color={fg}>{hourLabel(h)}</T>
                        <T size={10} color={fg} style={{ marginTop: 2, opacity: 0.85 }} numberOfLines={1}>{cell.label}</T>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </Scroll>
    </Screen>
  );
}
