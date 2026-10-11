import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, Field, Footer, Loading, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useProviderMe } from '@/lib/provider';
import { c } from '@/lib/theme';
import type { Group } from '@/lib/types';

export default function Categories() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: p } = useProviderMe();
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => api<Group[]>('/catalog/groups') });
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (p) setCats(p.categories.map((x) => x.id));
  }, [p]);

  const all = useMemo(() => (groups.data ?? []).flatMap((g) => g.categories.map((x) => ({ ...x, group: g.name }))), [groups.data]);
  if (!p || groups.isLoading) return <Screen><Loading /></Screen>;
  const byId = new Map(all.map((x) => [x.id, x]));
  const max = p.limits.maxCategories;
  const term = q.trim().toLowerCase();
  const list = (term ? all.filter((x) => x.name.toLowerCase().includes(term) || x.group.toLowerCase().includes(term)) : all).slice(0, 80);
  const dirty = JSON.stringify([...cats].sort()) !== JSON.stringify(p.categories.map((x) => x.id).sort());

  const save = async () => {
    setBusy(true);
    try {
      const fresh = await api('/provider/categories', { method: 'PUT', body: { categoryIds: cats } });
      qc.setQueryData(['provider-me'], fresh);
      toast('Categories saved');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title="My categories" subtitle={`Maximum ${max} · ${cats.length} selected`} />
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {cats.map((id) => (
            <Pressable key={id} onPress={() => setCats((s) => s.filter((x) => x !== id))} style={{ borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: c.accent }}>
              <T w="bold" size={12.5} color={c.a100}>{byId.get(id)?.name ?? id} ✕</T>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 10 }}>
          <Field value={q} onChangeText={setQ} placeholder="Search categories" />
        </View>
        {cats.length >= max && (
          <View style={{ marginTop: 10, backgroundColor: c.a200, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13 }}>
            <T size={12.5} color={c.a900}>You have used all {max} category slots. Remove one above to add another.</T>
          </View>
        )}
        <T size={11.5} color={c.n600} style={{ marginTop: 8 }}>Removing a category also removes its services (not allowed while they have confirmed bookings).</T>
      </View>
      <Scroll contentStyle={{ paddingTop: 4 }}>
        {list.map((x) => {
          const on = cats.includes(x.id);
          const disabled = !on && cats.length >= max;
          return (
            <Pressable key={x.id} disabled={disabled} onPress={() => setCats((s) => (on ? s.filter((y) => y !== x.id) : [...s, x.id]))} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.divider, opacity: disabled ? 0.4 : 1 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="semibold" size={14}>{x.name}</T>
                <T size={11} color={c.n600}>{x.group}</T>
              </View>
              <T size={15} color={on ? c.g600 : c.n400}>{on ? '✓' : '+'}</T>
            </Pressable>
          );
        })}
      </Scroll>
      {dirty && (
        <Footer>
          <Btn label="Save categories" size="lg" loading={busy} onPress={save} disabled={!cats.length} />
        </Footer>
      )}
    </Screen>
  );
}
