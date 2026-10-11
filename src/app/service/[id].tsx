import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, Chip, ConfirmSheet, Field, Footer, Kicker, Loading, Screen, Scroll, Stepper, T, Toggle, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { money, unitLabel } from '@/lib/format';
import { rateBounds, rateStep, useProviderMe } from '@/lib/provider';
import { c, radius } from '@/lib/theme';
import type { Unit } from '@/lib/types';

/** Create or edit one service: name, description, category, billing, rate, live. */
export default function ServiceEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const toast = useToast();
  const qc = useQueryClient();
  const { data: p } = useProviderMe();
  const existing = p?.services.find((s) => s.id === id);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<Unit>('HOUR');
  const [rate, setRate] = useState(50000);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!p) return;
    if (existing) {
      setName(existing.name);
      setDesc(existing.description);
      setCategoryId(existing.categoryId);
      setUnit(existing.unit);
      setRate(existing.rate);
      setPublished(existing.published);
    } else if (!categoryId && p.categories[0]) {
      const cat = p.categories[0];
      setCategoryId(cat.id);
      setUnit(cat.unit);
      setRate(cat.defaultRate);
    }
  }, [p, existing, categoryId]);

  if (!p) return <Screen><Loading /></Screen>;
  const cat = p.categories.find((x) => x.id === categoryId);
  const { min, max } = rateBounds(cat, unit);
  const full = (cid: string) => isNew && p.services.filter((s) => s.categoryId === cid).length >= p.limits.maxServicesPerCategory;

  const save = async () => {
    if (name.trim().length < 2) return toast('Give the service a name');
    if (full(categoryId)) return toast(`Up to ${p.limits.maxServicesPerCategory} services per category`);
    setBusy(true);
    try {
      const body = { categoryId, name: name.trim(), description: desc.trim(), unit, rate: Math.min(max, Math.max(min, rate)), published };
      if (isNew) await api('/provider/services', { body });
      else await api(`/provider/services/${id}`, { method: 'PATCH', body });
      await qc.invalidateQueries({ queryKey: ['provider-me'] });
      toast(isNew ? 'Service added' : 'Service saved');
      router.back();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/provider/services/${id}`, { method: 'DELETE' });
      await qc.invalidateQueries({ queryKey: ['provider-me'] });
      router.back();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not delete');
      setConfirmDelete(false);
    }
  };

  return (
    <Screen>
      <TopBar title={isNew ? 'New service' : 'Edit service'} subtitle={isNew ? 'Customers book this at your rate' : existing?.name} />
      <Scroll contentStyle={{ paddingTop: 12 }}>
        <Field label="Service name" value={name} onChangeText={setName} placeholder="e.g. Concealed leak repair" maxLength={80} />
        <View style={{ height: 13 }} />
        <Field label="What it covers" value={desc} onChangeText={setDesc} multiline placeholder="One or two lines the customer will read" maxLength={300} />
        <Kicker>Category</Kicker>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {p.categories.map((x) => (
            <Chip
              key={x.id}
              label={x.name + (full(x.id) ? ' (full)' : '')}
              active={categoryId === x.id}
              onPress={() => {
                setCategoryId(x.id);
                if (isNew) {
                  setUnit(x.unit);
                  setRate(x.defaultRate);
                }
              }}
            />
          ))}
        </View>
        <Kicker>Billing</Kicker>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['HOUR', 'DAY'] as Unit[]).map((u) => (
            <Pressable
              key={u}
              onPress={() => {
                if (u === unit) return;
                setUnit(u);
                setRate((r) => (u === 'DAY' ? r * 8 : Math.round(r / 8 / 100) * 100));
              }}
              style={{ flex: 1, alignItems: 'center', borderRadius: 14, padding: 12, backgroundColor: unit === u ? c.accent : c.n100, borderWidth: 1.5, borderColor: unit === u ? c.accent : c.n300 }}
            >
              <T w="bold" size={13} color={unit === u ? '#fff' : c.text}>{u === 'HOUR' ? 'Hourly' : 'Day rate'}</T>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 14, backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
          <Stepper size="lg" value={money(rate)} sub={unitLabel(unit)} onDown={() => setRate((r) => Math.max(min, r - rateStep(unit)))} onUp={() => setRate((r) => Math.min(max, r + rateStep(unit)))} />
          <T size={11} color={c.n600} style={{ textAlign: 'center', marginTop: 8 }}>Allowed for {cat?.name ?? 'this category'}: {money(min)} – {money(max)}</T>
        </View>
        <Pressable onPress={() => setPublished((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
          <View style={{ flex: 1 }}>
            <T w="bold" size={13.5}>{published ? 'Published' : 'Hidden'}</T>
            <T size={11.5} color={c.n600} style={{ marginTop: 2 }}>Published services appear in customer search</T>
          </View>
          <Toggle on={published} onPress={() => setPublished((v) => !v)} />
        </Pressable>
        {!isNew && (
          <Btn label="Delete this service" variant="ghost" textStyle={{ color: c.n600 }} onPress={() => setConfirmDelete(true)} style={{ marginTop: 16 }} />
        )}
        {!isNew && (
          <T size={11.5} color={c.n600} style={{ textAlign: 'center' }}>Rate changes apply to new requests only.</T>
        )}
      </Scroll>
      <Footer>
        <Btn label={isNew ? 'Add service' : 'Save changes'} size="lg" loading={busy} onPress={save} />
      </Footer>
      <ConfirmSheet visible={confirmDelete} title={`Delete ${name}?`} body="It is removed from your listing immediately. Services with confirmed bookings cannot be deleted." confirm="Delete service" danger="dark" onConfirm={remove} onClose={() => setConfirmDelete(false)} />
    </Screen>
  );
}
