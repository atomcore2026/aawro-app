import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ago, whenLabel } from '@/lib/format';
import { useConversations } from '@/lib/queries';
import { c } from '@/lib/theme';
import { Avatar, Empty, ErrorState, H, Loading, Screen, Scroll, T } from './ui';

/** Messages tab, shared by both apps. One conversation per booking. */
export function Conversations({ viewer }: { viewer: 'CUSTOMER' | 'PROVIDER' }) {
  const { data: raw, isPending, error, refetch, isRefetching } = useConversations();
  const data = raw ?? [];
  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
        <H size={26}>Messages</H>
        <T size={12.5} color={c.n600} style={{ marginTop: 2 }}>Every chat belongs to a booking</T>
      </View>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 12 }}>
          {!data.length ? (
            <Empty
              glyph="💬"
              title="No conversations"
              line={viewer === 'CUSTOMER' ? 'Once you send a booking request, a chat for that booking appears here.' : 'Chats open when a customer sends you a request.'}
            />
          ) : (
            data.map((cv) => (
              <Pressable key={cv.bookingId} onPress={() => router.push(`/chat/${cv.bookingId}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.divider }}>
                <Avatar uri={cv.photoUrl} name={cv.who} size={48} bg={viewer === 'CUSTOMER' ? c.a300 : c.g300} fg={viewer === 'CUSTOMER' ? c.a900 : c.g900} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <T w="heavy" size={14.5} numberOfLines={1} style={{ flex: 1 }}>{cv.who}</T>
                    <T size={11} color={c.n600}>{ago(cv.lastAt)}</T>
                  </View>
                  <T size={12.5} color={cv.unread ? c.text : c.n700} w={cv.unread ? 'semibold' : 'regular'} numberOfLines={1} style={{ marginTop: 2 }}>
                    {cv.last ?? 'No messages yet — say hello'}
                  </T>
                  <T size={11} color={c.n600} style={{ marginTop: 3 }} numberOfLines={1}>
                    {cv.serviceName} · {whenLabel(cv.dateKey, cv.startHour)} · {cv.statusLabel}
                  </T>
                </View>
                {cv.unread > 0 && <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: c.a600 }} />}
              </Pressable>
            ))
          )}
        </Scroll>
      )}
    </Screen>
  );
}
