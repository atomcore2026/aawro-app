import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Btn, Empty, ErrorState, Field, H, Loading, Screen, Scroll, Sheet, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { agoLong, stars } from '@/lib/format';
import { c, radius, shadow } from '@/lib/theme';
import type { Review } from '@/lib/types';

interface Reviews {
  avg: number;
  count: number;
  distribution: { stars: number; count: number }[];
  items: Review[];
}

export default function ReviewsScreen() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({ queryKey: ['my-reviews'], queryFn: () => api<Reviews>('/provider/reviews') });
  const [replying, setReplying] = useState<Review | null>(null);
  const [text, setText] = useState('');

  const reply = async () => {
    if (!replying) return;
    try {
      await api(`/reviews/${replying.id}/reply`, { body: { text: text.trim() } });
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      setReplying(null);
      setText('');
      toast('Reply posted on your profile');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not reply');
    }
  };

  if (isLoading) return <Screen><Loading /></Screen>;
  if (error || !data) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;
  const maxN = Math.max(1, ...data.distribution.map((d) => d.count));

  return (
    <Screen>
      <TopBar title="Reviews" subtitle={`${data.count} total`} />
      <Scroll contentStyle={{ paddingTop: 10 }} refreshing={isRefetching} onRefresh={refetch}>
        <View style={[{ flexDirection: 'row', gap: 18, alignItems: 'center', backgroundColor: c.n100, borderRadius: radius.lg, padding: 18 }, shadow.sm]}>
          <View style={{ alignItems: 'center' }}>
            <H size={38}>{data.count ? data.avg.toFixed(1) : '—'}</H>
            <T size={12} color={c.a600} style={{ marginTop: 2 }}>{stars(data.avg)}</T>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            {data.distribution.map((d) => (
              <View key={d.stars} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T size={11} color={c.n700} style={{ width: 10 }}>{d.stars}</T>
                <View style={{ flex: 1, height: 7, borderRadius: 999, backgroundColor: c.n300, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(d.count / maxN) * 100}%`, backgroundColor: c.a500 }} />
                </View>
                <T size={10.5} color={c.n600} style={{ width: 22, textAlign: 'right' }}>{d.count}</T>
              </View>
            ))}
          </View>
        </View>
        {!data.items.length && <Empty glyph="★" title="No reviews yet" line="Customers rate you after they pay. Great work gets great reviews." />}
        <View style={{ gap: 10, marginTop: 16 }}>
          {data.items.map((r) => (
            <View key={r.id} style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Avatar name={r.by} size={32} bg={c.n300} fg={c.n800} />
                <View style={{ flex: 1 }}>
                  <T w="bold" size={13.5}>{r.by}</T>
                  <T size={11} color={c.n600}>{r.service} · {agoLong(r.createdAt)}</T>
                </View>
                <T w="heavy" size={12} color={c.a600}>{stars(r.rating)}</T>
              </View>
              {!!r.text && <T size={13} color={c.n800} style={{ marginTop: 10, lineHeight: 19 }}>{r.text}</T>}
              {r.reply ? (
                <View style={{ marginTop: 10, backgroundColor: c.bg, borderRadius: 12, padding: 10 }}>
                  <T w="bold" size={11.5} color={c.n700}>Your reply</T>
                  <T size={12.5} color={c.n800} style={{ marginTop: 3 }}>{r.reply}</T>
                </View>
              ) : (
                <Pressable onPress={() => setReplying(r)} style={{ marginTop: 10 }}>
                  <T w="bold" size={12.5} color={c.a700}>Reply</T>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </Scroll>
      <Sheet visible={!!replying} onClose={() => setReplying(null)}>
        <H size={22} style={{ marginBottom: 6 }}>Reply to {replying?.by.split(' ')[0]}</H>
        <T size={12.5} color={c.n600} style={{ marginBottom: 12 }}>Shown under the review on your public profile. You can reply once.</T>
        <Field value={text} onChangeText={setText} multiline placeholder="Thank them, or explain what happened" maxLength={500} />
        <Btn label="Post reply" disabled={text.trim().length < 2} onPress={reply} style={{ marginTop: 14 }} />
      </Sheet>
    </Screen>
  );
}
