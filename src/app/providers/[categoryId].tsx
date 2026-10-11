import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ProviderCardView } from '@/components/ProviderCard';
import { Btn, Chip, Empty, H, Icon, ICON, Kicker, Screen, Scroll, Sheet, T, Toggle, TopBar, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { addDays, money, todayKey } from '@/lib/format';
import { useSaved } from '@/lib/queries';
import { c, radius } from '@/lib/theme';
import type { ProviderCard } from '@/lib/types';

const SORTS: [string, string][] = [
  ['recommended', 'Recommended'],
  ['rating', 'Top rated'],
  ['price', 'Price: low'],
  ['distance', 'Nearest'],
  ['reviews', 'Most reviews'],
];

interface Filters {
  verified: boolean;
  date: string | null;
  maxRate: number | null;
  maxKm: number | null;
}

export default function ProvidersList() {
  const { categoryId, service } = useLocalSearchParams<{ categoryId: string; service?: string }>();
  const toast = useToast();
  const saved = useSaved();
  const [sort, setSort] = useState('recommended');
  const [filters, setFilters] = useState<Filters>({ verified: false, date: null, maxRate: null, maxKm: null });
  const [sheet, setSheet] = useState(false);

  const params = new URLSearchParams({ sort });
  if (service) params.set('service', service);
  if (filters.verified) params.set('verified', 'true');
  if (filters.date) params.set('date', filters.date);
  if (filters.maxRate) params.set('maxRate', String(filters.maxRate));
  if (filters.maxKm) params.set('maxKm', String(filters.maxKm));

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['providers', categoryId, params.toString()],
    queryFn: () => api<{ category: { id: string; name: string; unit: string }; items: ProviderCard[] }>(`/categories/${categoryId}/providers?${params}`),
  });

  const active: { label: string; clear: () => void }[] = [];
  if (filters.verified) active.push({ label: 'Verified only', clear: () => setFilters((f) => ({ ...f, verified: false })) });
  if (filters.date) active.push({ label: filters.date === todayKey() ? 'Open today' : 'Open tomorrow', clear: () => setFilters((f) => ({ ...f, date: null })) });
  if (filters.maxRate) active.push({ label: `Under ${money(filters.maxRate)}`, clear: () => setFilters((f) => ({ ...f, maxRate: null })) });
  if (filters.maxKm) active.push({ label: `Within ${filters.maxKm} km`, clear: () => setFilters((f) => ({ ...f, maxKm: null })) });
  const clearAll = () => setFilters({ verified: false, date: null, maxRate: null, maxKm: null });

  const toggleSave = async (id: string) => {
    const on = await saved.toggle(id);
    toast(on ? 'Saved to your list' : 'Removed from saved');
  };

  return (
    <Screen>
      <TopBar
        title={service ?? data?.category.name ?? 'Providers'}
        subtitle={data ? `${data.items.length} provider${data.items.length === 1 ? '' : 's'}${service ? ` · ${data.category.name}` : ''}` : undefined}
        right={
          <Pressable accessibilityLabel="Filters" onPress={() => setSheet(true)} style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: c.a200, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.filter} size={18} color={c.a800} stroke={2.75} />
          </Pressable>
        }
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 }}>
          {SORTS.map(([k, label]) => (
            <Chip key={k} label={label} active={sort === k} onPress={() => setSort(k)} />
          ))}
        </ScrollView>
      </View>
      {!!active.length && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingHorizontal: 18, paddingBottom: 10 }}>
            {active.map((f) => (
              <Pressable key={f.label} onPress={f.clear} style={{ borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: c.g200 }}>
                <T w="bold" size={12} color={c.g900}>{f.label} ✕</T>
              </Pressable>
            ))}
            <Pressable onPress={clearAll} style={{ paddingVertical: 7, paddingHorizontal: 12 }}>
              <T w="bold" size={12} color={c.a700}>Clear all</T>
            </Pressable>
          </ScrollView>
        </View>
      )}
      <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 2 }}>
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 13, backgroundColor: c.n100, borderRadius: radius.md, padding: 12, opacity: 0.7 }}>
                <View style={{ width: 88, height: 88, borderRadius: 18, backgroundColor: c.n300 }} />
                <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
                  <View style={{ height: 14, width: '62%', borderRadius: 999, backgroundColor: c.n300 }} />
                  <View style={{ height: 11, width: '80%', borderRadius: 999, backgroundColor: c.n200 }} />
                  <View style={{ height: 11, width: '44%', borderRadius: 999, backgroundColor: c.n200 }} />
                </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <Empty glyph="⚠" tint={c.a200} title="Could not load providers" line="You seem to be offline. Your filters are saved." action="Retry" onAction={refetch} />
        ) : !data!.items.length ? (
          <View>
            <Empty title="No providers found" line="Nobody matches every filter in this category right now." />
            <View style={{ gap: 9, maxWidth: 260, alignSelf: 'center', width: '100%', marginTop: -30 }}>
              <Btn label="Remove all filters" size="sm" onPress={clearAll} />
              <Btn label="Increase distance to 25 km" size="sm" variant="outline" onPress={() => setFilters((f) => ({ ...f, maxKm: 25 }))} />
              <Btn label="Try another service" size="sm" variant="ghost" onPress={() => router.push('/(customer)/explore')} />
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {data!.items.map((p) => (
              <ProviderCardView key={p.id} p={p} saved={saved.ids.has(p.id)} onToggleSave={() => toggleSave(p.id)} />
            ))}
          </View>
        )}
      </Scroll>

      <Sheet visible={sheet} onClose={() => setSheet(false)}>
        <H size={23} style={{ marginBottom: 4 }}>Filters</H>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <View>
            <T w="bold" size={14}>Verified pros only</T>
            <T size={12} color={c.n600}>ID and documents checked by AAWRO</T>
          </View>
          <Toggle on={filters.verified} onPress={() => setFilters((f) => ({ ...f, verified: !f.verified }))} />
        </View>
        <Kicker>Open on</Kicker>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            [null, 'Any day'],
            [todayKey(), 'Today'],
            [addDays(todayKey(), 1), 'Tomorrow'],
          ].map(([v, label]) => (
            <Chip key={label} label={label!} active={filters.date === v} onPress={() => setFilters((f) => ({ ...f, date: v }))} />
          ))}
        </View>
        <Kicker>Max rate</Kicker>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[null, 50000, 100000, 200000].map((v) => (
            <Chip key={String(v)} label={v ? `Under ${money(v)}` : 'Any'} active={filters.maxRate === v} onPress={() => setFilters((f) => ({ ...f, maxRate: v }))} />
          ))}
        </View>
        <Kicker>Distance</Kicker>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[null, 5, 10, 25].map((v) => (
            <Chip key={String(v)} label={v ? `${v} km` : 'Any'} active={filters.maxKm === v} onPress={() => setFilters((f) => ({ ...f, maxKm: v }))} />
          ))}
        </View>
        <Btn label="Show providers" onPress={() => setSheet(false)} />
        <Btn label="Clear all" variant="ghost" onPress={clearAll} />
      </Sheet>
    </Screen>
  );
}
