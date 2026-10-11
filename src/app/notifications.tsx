import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Empty, ErrorState, Loading, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ago } from '@/lib/format';
import { useNotifications } from '@/lib/queries';
import { c, radius } from '@/lib/theme';

const KIND: Record<string, [string, string]> = {
  message: ['💬', c.a200],
  status: ['●', c.g200],
  payment: ['₹', c.a200],
  reminder: ['⏰', c.n300],
  review: ['★', c.g200],
  system: ['i', c.n300],
};

export default function Notifications() {
  const { refreshMe } = useAuth();
  const qc = useQueryClient();
  const { data, isPending, error, refetch, isRefetching } = useNotifications();

  const markAll = async () => {
    await api('/me/notifications/read', { body: {} });
    qc.invalidateQueries({ queryKey: ['notifications'] });
    refreshMe();
  };
  const clear = async () => {
    await api('/me/notifications', { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['notifications'] });
    refreshMe();
  };
  const open = async (n: { id: string; bookingId: string | null; read: boolean }) => {
    if (!n.read) {
      api('/me/notifications/read', { body: { ids: [n.id] } }).then(() => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
        refreshMe();
      });
    }
    if (n.bookingId) router.push(`/booking/${n.bookingId}`);
  };

  const has = !!data?.items?.length;
  return (
    <Screen>
      <TopBar
        title="Notifications"
        subtitle={data ? (data.unread ? `${data.unread} unread` : 'All caught up') : undefined}
        large
        right={
          has ? (
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={markAll}><T w="bold" size={12.5} color={c.a700}>Mark read</T></Pressable>
              <Pressable onPress={clear}><T w="bold" size={12.5} color={c.n600}>Clear</T></Pressable>
            </View>
          ) : undefined
        }
      />
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 10, gap: 9 }}>
          {!has && <Empty glyph="🔔" title="All caught up" line="Booking updates and messages will show up here." />}
          {(data?.items ?? []).map((n) => {
            const [glyph, tint] = KIND[n.kind] ?? KIND.system;
            return (
              <Pressable key={n.id} onPress={() => open(n)} style={{ flexDirection: 'row', gap: 12, backgroundColor: n.read ? c.n100 : c.a100, borderRadius: radius.md, padding: 13 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={16}>{glyph}</T>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
                    <T w="heavy" size={13.5} style={{ flex: 1 }}>{n.title}</T>
                    <T size={11} color={c.n600}>{ago(n.createdAt)}</T>
                  </View>
                  {!!n.body && <T size={12.5} color={c.n700} style={{ marginTop: 3, lineHeight: 17 }}>{n.body}</T>}
                </View>
                {!n.read && <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: c.a600, marginTop: 5 }} />}
              </Pressable>
            );
          })}
        </Scroll>
      )}
    </Screen>
  );
}
