import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BookingCard } from '@/components/BookingCard';
import { Btn, Chip, Empty, ErrorState, H, Loading, Screen, Scroll, Sheet, T, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { countdown } from '@/lib/format';
import { useBookings } from '@/lib/queries';
import { c } from '@/lib/theme';
import type { Booking } from '@/lib/types';

const TABS: [string, string, string, string][] = [
  ['requests', 'New requests', 'No new requests', 'When a customer picks one of your open slots, it lands here for you to accept.'],
  ['confirmed', 'Upcoming', 'Nothing confirmed yet', 'Accepted requests appear here with the locked slot.'],
  ['in_progress', 'In progress', 'No job in progress', 'Start a confirmed job to move it here.'],
  ['past', 'Completed', 'No completed jobs', 'Finished and paid jobs are archived here.'],
  ['cancelled', 'Cancelled', 'Nothing cancelled', 'Declined, expired and cancelled requests are kept here.'],
];
const REASONS = ['Fully booked', 'Outside my area', 'Needs a specialist', 'Rate too low', 'Personal emergency'];

export default function ProviderBookings() {
  const [tab, setTab] = useState('requests');
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isPending, error, refetch, isRefetching } = useBookings(tab);
  const all = useBookings();
  const counts = all.data?.counts ?? {};
  const [declining, setDeclining] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');

  const act = useMutation({
    mutationFn: ({ id, path, body }: { id: string; path: string; body?: unknown }) => api(`/bookings/${id}/${path}`, { body: body ?? {} }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDeclining(null);
      setReason('');
      toast({ accept: 'Accepted. Slot is now locked.', decline: 'Declined. Slot released.', start: 'Job started' }[v.path] ?? 'Updated');
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Something went wrong'),
  });

  const meta = TABS.find((t) => t[0] === tab)!;
  const waiting = counts.REQUESTED ?? 0;
  const confirmed = (counts.ACCEPTED ?? 0) + (counts.UPCOMING ?? 0);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
        <H size={26}>Bookings</H>
        <T size={12.5} color={c.n600} style={{ marginTop: 2 }}>{waiting} waiting on you · {confirmed} confirmed</T>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingHorizontal: 18, paddingVertical: 10 }}>
          {TABS.map(([k, label]) => {
            const n = k === 'requests' ? waiting : k === 'confirmed' ? confirmed : k === 'in_progress' ? counts.IN_PROGRESS ?? 0 : 0;
            return <Chip key={k} label={label + (n ? ` ${n}` : '')} active={tab === k} onPress={() => setTab(k)} />;
          })}
        </ScrollView>
      </View>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 6 }}>
          {!(data?.items ?? []).length ? (
            <Empty glyph="📋" title={meta[2]} line={meta[3]} action="Open more slots" onAction={() => router.push('/availability')} />
          ) : (
            <View style={{ gap: 11 }}>
              {(data?.items ?? []).map((b) => (
                <View key={b.id}>
                  <BookingCard b={b} viewer="PROVIDER" />
                  {b.actions.includes('accept') && (
                    <View style={{ flexDirection: 'row', gap: 9, marginTop: -6, backgroundColor: c.n100, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 13, paddingBottom: 13, paddingTop: 4 }}>
                      <Btn label="Decline" variant="outline" size="sm" onPress={() => setDeclining(b)} style={{ flex: 1 }} />
                      <Btn label={`Accept · ${countdown(b.expiresAt)} left`} variant="green" size="sm" loading={act.isPending && act.variables?.id === b.id && act.variables.path === 'accept'} onPress={() => act.mutate({ id: b.id, path: 'accept', body: { version: b.version } })} style={{ flex: 1.4 }} />
                    </View>
                  )}
                  {(b.actions.includes('start') || b.actions.includes('complete')) && (
                    <View style={{ flexDirection: 'row', gap: 9, marginTop: -6, backgroundColor: c.n100, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 13, paddingBottom: 13, paddingTop: 4 }}>
                      <Btn label="Chat" variant="outline" size="sm" onPress={() => router.push(`/chat/${b.id}`)} style={{ flex: 1 }} />
                      {b.actions.includes('start') ? (
                        <Btn label="Start service" size="sm" onPress={() => act.mutate({ id: b.id, path: 'start' })} style={{ flex: 1 }} />
                      ) : (
                        <Btn label="Mark complete" size="sm" onPress={() => router.push(`/booking/${b.id}`)} style={{ flex: 1 }} />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Scroll>
      )}
      <Sheet visible={!!declining} onClose={() => setDeclining(null)}>
        <H size={23} style={{ marginBottom: 8 }}>Decline this request?</H>
        <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>The customer is told straight away and the slot goes back on your calendar for someone else.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {REASONS.map((r) => (
            <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
          ))}
        </View>
        <Btn label="Decline request" style={{ backgroundColor: c.a700 }} loading={act.isPending} onPress={() => declining && act.mutate({ id: declining.id, path: 'decline', body: { reason: reason || undefined } })} />
        <Btn label="Keep it open" variant="ghost" textStyle={{ color: c.text }} onPress={() => setDeclining(null)} />
      </Sheet>
    </Screen>
  );
}
