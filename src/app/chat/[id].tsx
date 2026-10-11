import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Avatar, BackButton, Icon, ICON, Loading, Pill, Screen, T, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money, timeOfDay, whenLabel } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { joinBooking, onSocketEvent, sendTyping } from '@/lib/socket';
import { c, font, radius } from '@/lib/theme';
import type { Message } from '@/lib/types';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const mine = me?.role ?? 'CUSTOMER';
  const { data: b } = useBooking(id);
  const { data, isLoading } = useQuery({ queryKey: ['messages', id], queryFn: () => api<{ items: Message[] }>(`/bookings/${id}/messages`), refetchInterval: 15_000 });
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const lastTyping = useRef(0);

  useEffect(() => (id ? joinBooking(id) : undefined), [id]);
  useEffect(
    () =>
      onSocketEvent((event, payload) => {
        if (event === 'typing' && payload.bookingId === id) {
          setTyping(true);
          setTimeout(() => setTyping(false), 3500);
        }
      }),
    [id],
  );
  // Mark the other side's messages as read whenever new ones arrive.
  useEffect(() => {
    if (!data?.items.some((m) => m.senderRole !== mine && !m.readAt)) return;
    api(`/bookings/${id}/messages/read`, { body: {} }).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [data, id, mine, qc]);

  const items = [...(data?.items ?? []), ...pending.filter((p) => !data?.items.some((m) => m.clientId === p.clientId))];
  const canChat = b?.actions.includes('chat');

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const temp: Message = { id: clientId, bookingId: id!, senderRole: mine, body, attachmentUrl: null, clientId, readAt: null, createdAt: new Date().toISOString(), pending: true };
    setPending((p) => [...p, temp]);
    setDraft('');
    try {
      await api(`/bookings/${id}/messages`, { body: { body, clientId } });
      await qc.invalidateQueries({ queryKey: ['messages', id] });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Message not sent');
      setDraft(body);
    } finally {
      setPending((p) => p.filter((m) => m.clientId !== clientId));
    }
  };

  const onType = (t: string) => {
    setDraft(t);
    if (Date.now() - lastTyping.current > 3000) {
      lastTyping.current = Date.now();
      sendTyping(id!);
    }
  };

  const who = mine === 'CUSTOMER' ? b?.provider?.name : b?.customer?.name;
  return (
    <Screen bg={c.bg}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: c.n100, borderBottomWidth: 1, borderBottomColor: c.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BackButton />
          <Avatar uri={mine === 'CUSTOMER' ? b?.provider?.photoUrl : null} name={who} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w="heavy" size={14.5} numberOfLines={1}>{who ?? ' '}</T>
            <T w="bold" size={11.5} color={c.g700}>{typing ? 'typing…' : mine === 'CUSTOMER' ? b?.provider?.person : 'Customer'}</T>
          </View>
        </View>
        {b && (
          <Pressable onPress={() => router.push(`/booking/${b.id}`)} style={{ marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bg, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="heavy" size={13} numberOfLines={1}>{b.serviceName}</T>
              <T size={11.5} color={c.n700}>{whenLabel(b.dateKey, b.startHour)} · {money(mine === 'PROVIDER' ? b.pricing.providerPayout : b.pricing.customerTotal, { decimals: true })}</T>
            </View>
            <Pill label={b.statusLabel} toneKey={b.statusTone} size="sm" />
          </Pressable>
        )}
      </View>
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          ref={list}
          data={items}
          keyExtractor={(m) => m.clientId ?? m.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<T size={13} color={c.n600} style={{ textAlign: 'center', marginTop: 40 }}>Say hello — share access details or questions about the job here. Phone numbers are hidden to keep you protected.</T>}
          renderItem={({ item: m }) => {
            const me2 = m.senderRole === mine;
            return (
              <View style={{ flexDirection: 'row', justifyContent: me2 ? 'flex-end' : 'flex-start' }}>
                <View style={{ maxWidth: '78%', backgroundColor: me2 ? c.accent : c.n100, borderRadius: 18, borderBottomRightRadius: me2 ? 6 : 18, borderBottomLeftRadius: me2 ? 18 : 6, paddingVertical: 11, paddingHorizontal: 14, opacity: m.pending ? 0.6 : 1 }}>
                  <T size={13.5} color={me2 ? '#fff' : c.text} style={{ lineHeight: 19 }}>{m.body}</T>
                  <T size={10} color={me2 ? '#fff' : c.text} style={{ marginTop: 5, opacity: 0.7, textAlign: 'right' }}>
                    {timeOfDay(m.createdAt)} {me2 ? (m.pending ? '…' : m.readAt ? '✓✓' : '✓') : ''}
                  </T>
                </View>
              </View>
            );
          }}
        />
      )}
      {canChat ? (
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: c.n100, borderTopWidth: 1, borderTopColor: c.divider }}>
          <TextInput
            value={draft}
            onChangeText={onType}
            placeholder="Message"
            placeholderTextColor={c.n500}
            multiline
            style={{ flex: 1, minHeight: 46, maxHeight: 120, borderRadius: radius.lg, borderWidth: 1, borderColor: c.divider, backgroundColor: c.surface, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 12, fontFamily: font.regular, fontSize: 14.5, color: c.text }}
          />
          <Pressable accessibilityLabel="Send" onPress={send} style={{ width: 46, height: 46, borderRadius: 999, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.send} size={19} color="#fff" />
          </Pressable>
        </View>
      ) : (
        b && (
          <View style={{ padding: 16, backgroundColor: c.n100, borderTopWidth: 1, borderTopColor: c.divider }}>
            <T size={12.5} color={c.n600} style={{ textAlign: 'center' }}>Chat is closed for this booking.</T>
          </View>
        )
      )}
    </Screen>
  );
}
