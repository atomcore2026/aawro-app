import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BookingCard } from '@/components/BookingCard';
import { Chip, Empty, ErrorState, H, Loading, Screen, Scroll, T } from '@/components/ui';
import { useBookings } from '@/lib/queries';
import { c } from '@/lib/theme';

const TABS: [string, string, string][] = [
  ['upcoming', 'Upcoming', 'Requests and confirmed bookings show up here.'],
  ['past', 'Past', 'Completed and paid bookings are kept here.'],
  ['cancelled', 'Cancelled', 'Declined, expired and cancelled requests land here.'],
];

export default function Bookings() {
  const [tab, setTab] = useState('upcoming');
  const { data, isPending, error, refetch, isRefetching } = useBookings(tab);
  const all = useBookings();
  const counts = all.data?.counts ?? {};
  const active = (counts.REQUESTED ?? 0) + (counts.ACCEPTED ?? 0) + (counts.UPCOMING ?? 0) + (counts.IN_PROGRESS ?? 0);
  const due = counts.COMPLETED ?? 0;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
        <H size={26}>My bookings</H>
        <T size={12.5} color={c.n600} style={{ marginTop: 2 }}>
          {active} active{due ? ` · ${due} payment due` : ''}
        </T>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingHorizontal: 18, paddingVertical: 10 }}>
          {TABS.map(([k, label]) => (
            <Chip key={k} label={label} active={tab === k} onPress={() => setTab(k)} />
          ))}
        </ScrollView>
      </View>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 2 }}>
          {!(data?.items ?? []).length ? (
            <Empty glyph="📅" title="Nothing here yet" line={TABS.find((t) => t[0] === tab)![2]} action="Find a service" onAction={() => router.push('/(customer)/explore')} />
          ) : (
            <View style={{ gap: 11 }}>
              {(data?.items ?? []).map((b) => (
                <BookingCard key={b.id} b={b} viewer="CUSTOMER" />
              ))}
            </View>
          )}
        </Scroll>
      )}
    </Screen>
  );
}
