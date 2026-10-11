import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icon, ICON, Loading, Pill, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { timeOfDay } from '@/lib/format';
import { c, font, radius } from '@/lib/theme';
import { Ticket, TICKET_TONE } from '@/lib/tickets';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: t } = useQuery({ queryKey: ['ticket', id], queryFn: () => api<Ticket>(`/tickets/${id}`), refetchInterval: 20_000 });
  const [draft, setDraft] = useState('');

  const send = async () => {
    if (!draft.trim()) return;
    try {
      await api(`/tickets/${id}/messages`, { body: { body: draft.trim() } });
      setDraft('');
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Not sent');
    }
  };

  if (!t) return <Screen><Loading /></Screen>;
  const [label, tone] = TICKET_TONE[t.status] ?? [t.status, 'grey'];
  return (
    <Screen>
      <TopBar title={t.subject} subtitle={t.code} right={<Pill label={label} toneKey={tone} />} />
      <Scroll contentStyle={{ paddingTop: 10, gap: 10 }}>
        {t.resolution && (
          <View style={{ backgroundColor: c.g100, borderRadius: radius.md, padding: 14 }}>
            <T w="heavy" size={13.5} color={c.g900}>Resolved</T>
            <T size={12.5} color={c.g900} style={{ marginTop: 4 }}>{t.resolution.reason}</T>
          </View>
        )}
        {t.messages.map((m) => {
          const mine = m.authorType !== 'ADMIN';
          return (
            <View key={m.id} style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <View style={{ maxWidth: '82%', backgroundColor: mine ? c.accent : c.n100, borderRadius: 18, padding: 12 }}>
                {!mine && <T w="bold" size={11.5} color={c.a700} style={{ marginBottom: 3 }}>AAWRO Support</T>}
                <T size={13.5} color={mine ? '#fff' : c.text} style={{ lineHeight: 19 }}>{m.body}</T>
                <T size={10} color={mine ? '#fff' : c.text} style={{ opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{timeOfDay(m.at)}</T>
              </View>
            </View>
          );
        })}
      </Scroll>
      {t.status !== 'CLOSED' && (
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', padding: 12, backgroundColor: c.n100, borderTopWidth: 1, borderTopColor: c.divider }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Reply to support" placeholderTextColor={c.n500} style={{ flex: 1, height: 46, borderRadius: radius.pill, borderWidth: 1, borderColor: c.divider, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 14.5 }} />
          <Pressable onPress={send} style={{ width: 46, height: 46, borderRadius: 999, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.send} size={19} color="#fff" />
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
