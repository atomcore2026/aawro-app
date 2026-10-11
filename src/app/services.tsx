import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, ConfirmSheet, Loading, Screen, Scroll, Stepper, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { money, unitLabel } from '@/lib/format';
import { rateBounds, rateStep, useProviderMe } from '@/lib/provider';
import { c, radius, shadow } from '@/lib/theme';
import type { Service } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';

export default function Services() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: p, refetch, isRefetching } = useProviderMe();
  const [del, setDel] = useState<Service | null>(null);
  if (!p) return <Screen><Loading /></Screen>;

  const patch = async (s: Service, body: Partial<Service>) => {
    try {
      await api(`/provider/services/${s.id}`, { method: 'PATCH', body });
      await qc.invalidateQueries({ queryKey: ['provider-me'] });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not update');
    }
  };
  const remove = async () => {
    if (!del) return;
    try {
      await api(`/provider/services/${del.id}`, { method: 'DELETE' });
      await qc.invalidateQueries({ queryKey: ['provider-me'] });
      toast('Service deleted');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not delete');
    } finally {
      setDel(null);
    }
  };

  const live = p.services.filter((s) => s.published).length;
  return (
    <Screen>
      <TopBar title="My services" subtitle={`${live} live · ${p.services.length - live} hidden`} />
      <Scroll contentStyle={{ paddingTop: 10 }} refreshing={isRefetching} onRefresh={refetch}>
        <View style={{ gap: 11 }}>
          {p.services.map((s) => {
            const cat = p.categories.find((x) => x.id === s.categoryId);
            const { min, max } = rateBounds(cat, s.unit);
            return (
              <View key={s.id} style={[{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }, shadow.sm]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="heavy" size={15}>{s.name}</T>
                    <T size={11.5} color={c.n600} style={{ marginTop: 2 }}>{cat?.name ?? s.categoryId}</T>
                    {!!s.description && <T size={12.5} color={c.n700} style={{ marginTop: 6, lineHeight: 18 }}>{s.description}</T>}
                  </View>
                  <View style={{ borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: s.published ? c.g200 : c.n200 }}>
                    <T w="heavy" size={10.5} color={s.published ? c.g900 : c.n700}>{s.published ? 'LIVE' : 'HIDDEN'}</T>
                  </View>
                </View>
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.divider }}>
                  <Stepper
                    value={money(s.rate)}
                    sub={unitLabel(s.unit)}
                    onDown={() => s.rate - rateStep(s.unit) >= min ? patch(s, { rate: s.rate - rateStep(s.unit) }) : toast(`Minimum for this category is ${money(min)}`)}
                    onUp={() => s.rate + rateStep(s.unit) <= max ? patch(s, { rate: s.rate + rateStep(s.unit) }) : toast(`Maximum for this category is ${money(max)}`)}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 11 }}>
                  <Btn label={s.published ? 'Unpublish' : 'Publish'} variant="outline" size="sm" onPress={() => patch(s, { published: !s.published })} style={{ flex: 1 }} />
                  <Btn label="Edit" variant="soft" size="sm" onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })} style={{ paddingHorizontal: 15 }} />
                  <Pressable accessibilityLabel="Delete service" onPress={() => setDel(s)} style={{ width: 44, borderRadius: 999, backgroundColor: c.n200, alignItems: 'center', justifyContent: 'center' }}>
                    <T size={14} color={c.n700}>🗑</T>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
        <Pressable onPress={() => router.push({ pathname: '/service/[id]', params: { id: 'new' } })} style={{ marginTop: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.n400, borderRadius: radius.md, padding: 16, alignItems: 'center' }}>
          <T w="bold" size={13.5}>Add a service</T>
          <T size={12} color={c.n700} style={{ marginTop: 4 }}>Only inside your {p.limits.maxCategories} chosen categories · up to {p.limits.maxServicesPerCategory} per category</T>
          <View style={{ marginTop: 11, backgroundColor: c.accent, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 }}>
            <T w="bold" size={13} color={c.a100}>New service</T>
          </View>
        </Pressable>
        <Btn label="Manage categories" variant="ghost" size="sm" onPress={() => router.push('/categories')} style={{ marginTop: 6 }} />
      </Scroll>
      <ConfirmSheet
        visible={!!del}
        title={`Delete ${del?.name}?`}
        body="It is removed from your listing immediately. Services with confirmed bookings cannot be deleted."
        confirm="Delete service"
        danger="dark"
        onConfirm={remove}
        onClose={() => setDel(null)}
      />
    </Screen>
  );
}
