import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, Empty, ErrorState, H, Img, Loading, Screen, Scroll, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { c, radius, shadow } from '@/lib/theme';
import type { Category } from '@/lib/types';

interface CategoryDetail extends Category {
  services: { name: string; description: string; unit: 'HOUR' | 'DAY'; fromRate: number; proCount: number }[];
}

/** "Pick the exact service" inside a category. */
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['category', id], queryFn: () => api<CategoryDetail>(`/catalog/categories/${id}`) });
  const all = () => router.push({ pathname: '/providers/[categoryId]', params: { categoryId: id } });

  return (
    <Screen>
      <TopBar title={data?.name ?? 'Service'} subtitle={data?.group} />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll contentStyle={{ paddingTop: 8 }}>
          <View style={[{ borderRadius: radius.lg, overflow: 'hidden', marginBottom: 18 }, shadow.sm]}>
            <Img uri={data!.imageUrl} style={{ height: 150 }} />
          </View>
          <H size={19} style={{ marginBottom: 4 }}>Pick the exact service</H>
          <T size={12.5} color={c.n600} style={{ marginBottom: 14 }}>Rates are set by each provider.</T>
          {data!.services.length ? (
            <View style={{ gap: 9 }}>
              {data!.services.map((s) => (
                <Card key={s.name} onPress={() => router.push({ pathname: '/providers/[categoryId]', params: { categoryId: id, service: s.name } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="bold" size={15}>{s.name}</T>
                    {!!s.description && <T size={12.5} color={c.n700} style={{ marginTop: 3 }}>{s.description}</T>}
                    <T w="bold" size={12.5} color={c.a700} style={{ marginTop: 6 }}>
                      From {money(s.fromRate)}{s.unit === 'DAY' ? '/day' : '/hr'} · {s.proCount} pro{s.proCount > 1 ? 's' : ''}
                    </T>
                  </View>
                  <T size={18} color={c.n500}>›</T>
                </Card>
              ))}
            </View>
          ) : (
            <Empty title="No pros here yet" line="Nobody offers this service in your area yet. We've noted the demand." action="Browse other services" onAction={() => router.push('/(customer)/explore')} />
          )}
          {!!data!.services.length && (
            <Pressable onPress={all} style={{ marginTop: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.n400, borderRadius: radius.md, padding: 14, alignItems: 'center' }}>
              <T w="bold" size={14} color={c.a700}>See all {data!.name} providers</T>
            </Pressable>
          )}
        </Scroll>
      )}
    </Screen>
  );
}
