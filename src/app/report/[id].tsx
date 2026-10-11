import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Chip, Field, Footer, Kicker, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { c, radius } from '@/lib/theme';

const REASONS = ['Work not finished', 'Poor quality', 'Provider did not show up', 'Charged more than agreed', 'Damage to property', 'Something else'];

/** Raise a dispute within 48 h of completion. */
export default function Report() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const send = useMutation({
    mutationFn: () => api(`/bookings/${id}/dispute`, { body: { reason, description: description.trim() } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      toast('Reported. AAWRO support will reply within 2 hours.');
      router.back();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not report'),
  });
  return (
    <Screen>
      <TopBar title="Report a problem" subtitle="We hold the provider's payout while we look into it" />
      <Scroll contentStyle={{ paddingTop: 8 }}>
        <Kicker style={{ marginTop: 6 }}>What went wrong?</Kicker>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REASONS.map((r) => (
            <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
          ))}
        </View>
        <Kicker>Tell us more</Kicker>
        <Field value={description} onChangeText={setDescription} multiline placeholder="What happened? Include anything that helps us decide." maxLength={2000} />
        <View style={{ marginTop: 14, backgroundColor: c.a100, borderRadius: radius.md, padding: 13 }}>
          <T size={12.5} color={c.a900} style={{ lineHeight: 18 }}>Our team replies in the support ticket within 2 hours and aims to resolve disputes within 48 hours. Refunds go back to your original payment method.</T>
        </View>
      </Scroll>
      <Footer>
        <Btn label="Submit report" size="lg" disabled={!reason} loading={send.isPending} onPress={() => send.mutate()} />
      </Footer>
    </Screen>
  );
}
