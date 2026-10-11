import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Card, Empty, Field, H, Kicker, Loading, Pill, Screen, Scroll, Sheet, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { agoLong } from '@/lib/format';
import { c, radius } from '@/lib/theme';
import { Ticket, TICKET_TONE } from '@/lib/tickets';

const FAQ: [string, string][] = [
  ['When do I pay?', 'Only after the provider marks the job complete. You pay in the app by UPI, card or netbanking.'],
  ['Can I cancel?', 'Free until 4 hours before the start. After that a 20% fee applies to the service amount.'],
  ['What if something goes wrong?', 'Open the booking and tap "Report a problem" within 48 hours. We hold the provider payout until we resolve it.'],
];

export default function Help() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['tickets'], queryFn: () => api<Ticket[]>('/tickets') });
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const t = await api<Ticket>('/tickets', { body: { subject: subject.trim(), description: desc.trim() } });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setOpen(false);
      setSubject('');
      setDesc('');
      router.push(`/ticket/${t.id}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Help & support" subtitle="We reply within 2 hours, 8 AM – 10 PM" large />
      <Scroll contentStyle={{ paddingTop: 10 }}>
        <Btn label="Contact support" onPress={() => setOpen(true)} />
        <Kicker>Your tickets</Kicker>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty glyph="?" title="No tickets" line="Questions about a booking, a payment or your account? Write to us." />
        ) : (
          <View style={{ gap: 9 }}>
            {data.map((t) => {
              const [label, tone] = TICKET_TONE[t.status] ?? [t.status, 'grey'];
              return (
                <Card key={t.id} onPress={() => router.push(`/ticket/${t.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="heavy" size={13.5} numberOfLines={1}>{t.subject}</T>
                    <T size={11.5} color={c.n600}>{t.code} · {t.kind === 'DISPUTE' ? 'Dispute' : 'Support'} · {agoLong(t.updatedAt)}</T>
                  </View>
                  <Pill label={label} toneKey={tone} size="sm" />
                </Card>
              );
            })}
          </View>
        )}
        <Kicker>Common questions</Kicker>
        <View style={{ gap: 9 }}>
          {FAQ.map(([q, a]) => (
            <View key={q} style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
              <T w="bold" size={13.5}>{q}</T>
              <T size={12.5} color={c.n700} style={{ marginTop: 4, lineHeight: 18 }}>{a}</T>
            </View>
          ))}
        </View>
      </Scroll>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <H size={22} style={{ marginBottom: 14 }}>Write to support</H>
        <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Charged twice" />
        <View style={{ height: 10 }} />
        <Field label="Details" value={desc} onChangeText={setDesc} multiline placeholder="Booking code, what happened…" />
        <Btn label="Send" loading={busy} disabled={subject.trim().length < 3} onPress={create} style={{ marginTop: 16 }} />
      </Sheet>
    </Screen>
  );
}
