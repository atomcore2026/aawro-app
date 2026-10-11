import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Card, ErrorState, Img, Loading, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { c, radius } from '@/lib/theme';
import type { Group } from '@/lib/types';
import { Chevron, metaFor } from '@/components/catalog';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['group', id], queryFn: () => api<Group>(`/catalog/groups/${id}`) });
  return (
    <Screen>
      <TopBar title={data?.name ?? 'Services'} subtitle={data ? `${data.categoryCount} services` : undefined} large />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll contentStyle={{ paddingTop: 6 }}>
          <Img uri={data!.imageUrl} radius={radius.lg} style={{ height: 132, marginBottom: 14 }} fallback={c.n300} />
          <View style={{ gap: 9 }}>
            {data!.categories.map((cat) => (
              <Card key={cat.id} onPress={() => router.push(`/category/${cat.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="bold" size={15}>{cat.name}</T>
                  <T w="semibold" size={12.5} color={c.a700} style={{ marginTop: 3 }}>{metaFor(cat)}</T>
                </View>
                <Chevron />
              </Card>
            ))}
          </View>
        </Scroll>
      )}
    </Screen>
  );
}
