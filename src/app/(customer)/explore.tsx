import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Chevron, metaFor } from '@/components/catalog';
import { Card, ErrorState, Field, H, Img, Loading, Screen, Scroll, T } from '@/components/ui';
import { api } from '@/lib/api';
import { c, radius, shadow } from '@/lib/theme';
import type { Group } from '@/lib/types';

export default function Explore() {
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch, isRefetching } = useQuery({ queryKey: ['groups'], queryFn: () => api<Group[]>('/catalog/groups') });
  const total = data?.reduce((s, g) => s + g.categoryCount, 0) ?? 0;

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !data) return null;
    return data.flatMap((g) => g.categories.filter((cat) => cat.name.toLowerCase().includes(term) || g.name.toLowerCase().includes(term)).map((cat) => ({ ...cat, group: g.name }))).slice(0, 40);
  }, [q, data]);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 }}>
        <H size={24}>Explore</H>
        <T size={12} color={c.n600} style={{ marginTop: 2 }}>{data ? `${data.length} service groups · ${total} services` : 'Every service on AAWRO'}</T>
      </View>
      <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
        <Field value={q} onChangeText={setQ} placeholder="Search a service, e.g. tutor" returnKeyType="search" />
      </View>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : results ? (
        <Scroll>
          <View style={{ gap: 9 }}>
            {results.map((r) => (
              <Card key={r.id} onPress={() => router.push(`/category/${r.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="bold" size={15}>{r.name}</T>
                  <T size={12} color={c.n600} style={{ marginTop: 2 }}>{r.group}</T>
                  <T w="semibold" size={12.5} color={c.a700} style={{ marginTop: 3 }}>{metaFor(r)}</T>
                </View>
                <Chevron />
              </Card>
            ))}
            {!results.length && <T size={14} color={c.n700} style={{ textAlign: 'center', paddingVertical: 40 }}>No service matches that. Try a broader word.</T>}
          </View>
        </Scroll>
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
            {data!.map((g) => (
              <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)} style={[{ width: '48.4%', aspectRatio: 1 / 1.08, borderRadius: radius.lg, overflow: 'hidden' }, shadow.sm]}>
                <Img uri={g.imageUrl} style={{ flex: 1 }} fallback={c.n300}>
                  <View style={{ flex: 1, justifyContent: 'flex-end', padding: 13, backgroundColor: 'rgba(20,14,10,0.3)' }}>
                    <T w="heavy" size={14.5} color="#fff" style={{ lineHeight: 17 }}>{g.name}</T>
                    <T w="semibold" size={11} color="#fff" style={{ marginTop: 3 }}>{g.categoryCount} services</T>
                  </View>
                </Img>
              </Pressable>
            ))}
          </View>
        </Scroll>
      )}
    </Screen>
  );
}
