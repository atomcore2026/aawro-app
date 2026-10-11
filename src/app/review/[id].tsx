import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Btn, Chip, Field, Footer, H, Kicker, Loading, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { whenLabel } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { c, radius, shadow } from '@/lib/theme';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const ASPECTS = ['Quality', 'Professionalism', 'Punctuality', 'Communication'];
const TAGS = ['On time', 'Skilled', 'Friendly', 'Value for money', 'Tidy work'];

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: b } = useBooking(id);
  const [rating, setRating] = useState(0);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');

  const submit = useMutation({
    mutationFn: () => api(`/bookings/${id}/review`, { body: { rating, text: text.trim(), tags, details: aspects } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.replace(`/review-done/${id}`);
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not submit'),
  });

  if (!b) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      <TopBar title="Rate your service" subtitle={b.serviceName} />
      <Scroll contentStyle={{ paddingTop: 12 }}>
        <View style={[{ alignItems: 'center', backgroundColor: c.n100, borderRadius: radius.lg, paddingVertical: 20, paddingHorizontal: 16 }, shadow.sm]}>
          <Avatar uri={b.provider?.photoUrl} name={b.provider?.name} size={62} bg={c.a300} fg={c.a900} />
          <T w="heavy" size={16} style={{ marginTop: 12 }}>{b.provider?.name}</T>
          <T size={12.5} color={c.n600} style={{ marginTop: 2 }}>{whenLabel(b.dateKey, b.startHour)}</T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityLabel={`${n} stars`}>
                <T size={34} color={n <= rating ? '#f59e0b' : c.n400} style={{ lineHeight: 40 }}>{n <= rating ? '★' : '☆'}</T>
              </Pressable>
            ))}
          </View>
          <T w="bold" size={13} color={c.n700} style={{ marginTop: 10 }}>{rating ? WORDS[rating] : 'Tap a star to rate'}</T>
        </View>

        <Kicker>Rate the details</Kicker>
        <View style={{ gap: 11 }}>
          {ASPECTS.map((a) => (
            <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.n100, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 14 }}>
              <T w="bold" size={13.5} style={{ flex: 1 }}>{a}</T>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} hitSlop={4} onPress={() => setAspects((s) => ({ ...s, [a]: n }))} style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 1.5, borderColor: c.n400, backgroundColor: n <= (aspects[a] ?? 0) ? c.accent : 'transparent' }} />
                ))}
              </View>
            </View>
          ))}
        </View>

        <Kicker>What stood out</Kicker>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TAGS.map((t) => (
            <Chip key={t} label={t} active={tags.includes(t)} color="green" onPress={() => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))} />
          ))}
        </View>

        <Kicker>Write a review</Kicker>
        <Field value={text} onChangeText={setText} multiline placeholder="What should other customers know?" maxLength={2000} />
      </Scroll>
      <Footer>
        <Btn label="Submit review" size="lg" disabled={!rating} loading={submit.isPending} onPress={() => submit.mutate()} />
      </Footer>
    </Screen>
  );
}
