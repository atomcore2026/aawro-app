import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { BackButton, Empty, Kicker, Loading, Screen, Scroll, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { c, font, radius, tiles } from '@/lib/theme';
import type { Category, ProviderCard } from '@/lib/types';
import { metaFor } from '@/components/catalog';

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function Search() {
  const { me, refreshMe } = useAuth();
  const [q, setQ] = useState('');
  const term = useDebounced(q.trim());
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api<Category[]>('/catalog/trending') });
  const results = useQuery({
    queryKey: ['search', term],
    queryFn: () => api<{ categories: Category[]; providers: ProviderCard[] }>(`/search?q=${encodeURIComponent(term)}`),
    enabled: term.length >= 2,
  });

  const clearRecent = async (t?: string) => {
    await api(`/me/searches${t ? `?term=${encodeURIComponent(t)}` : ''}`, { method: 'DELETE' });
    refreshMe();
  };
  useEffect(() => {
    if (results.isSuccess) refreshMe();
  }, [results.isSuccess, refreshMe]);

  const row = (key: string, onPress: () => void, title: string, sub: string, i: number, glyph = '●') => (
    <Pressable key={key} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.divider }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tiles[i % 4], alignItems: 'center', justifyContent: 'center' }}>
        <T size={15}>{glyph}</T>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="semibold" size={15} numberOfLines={1}>{title}</T>
        <T size={11.5} color={c.n600} numberOfLines={1}>{sub}</T>
      </View>
      <T size={16} color={c.n500}>›</T>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 }}>
        <BackButton />
        <TextInput
          value={q}
          onChangeText={setQ}
          autoFocus
          placeholder="Search 300 services"
          placeholderTextColor={c.n500}
          returnKeyType="search"
          style={{ flex: 1, height: 46, borderRadius: radius.pill, backgroundColor: c.surface, borderWidth: 1, borderColor: c.divider, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 14.5, color: c.text }}
        />
      </View>
      <Scroll contentStyle={{ paddingTop: 8 }}>
        {term.length < 2 ? (
          <>
            {!!me?.recentSearches?.length && (
              <>
                <Kicker style={{ marginTop: 6 }} right={<Pressable onPress={() => clearRecent()}><T w="bold" size={12} color={c.a700}>Clear all</T></Pressable>}>
                  Recent searches
                </Kicker>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {me.recentSearches.map((s) => (
                    <Pressable key={s} onPress={() => setQ(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: c.n200 }}>
                      <T w="semibold" size={12.5}>{s}</T>
                      <Pressable hitSlop={8} onPress={() => clearRecent(s)}>
                        <T size={11} color={c.n600}>✕</T>
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <Kicker style={{ marginTop: 22 }}>Trending</Kicker>
            {(trending.data ?? []).map((cat, i) => row(cat.id, () => router.push(`/category/${cat.id}`), cat.name, cat.group ?? '', i))}
          </>
        ) : results.isLoading ? (
          <Loading />
        ) : results.data && (results.data.categories.length || results.data.providers.length) ? (
          <>
            <T size={12.5} color={c.n600} style={{ marginTop: 4, marginBottom: 10 }}>
              {results.data.categories.length} services · {results.data.providers.length} providers
            </T>
            {results.data.categories.map((cat, i) => row(cat.id, () => router.push(`/category/${cat.id}`), cat.name, `${cat.group} · ${metaFor(cat)}`, i))}
            {!!results.data.providers.length && <Kicker>Providers</Kicker>}
            {results.data.providers.map((p, i) => row(p.id, () => router.push(`/provider/${p.id}`), p.name, `${p.areaName} · ★ ${p.rating.toFixed(1)}`, i + 1, '★'))}
          </>
        ) : (
          <Empty glyph="⚲" title={`No service matches "${term}"`} line="Try a broader word, or browse the 30 service groups." action="Browse all categories" onAction={() => router.push('/(customer)/explore')} />
        )}
      </Scroll>
    </Screen>
  );
}
