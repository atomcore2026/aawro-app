import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, Card, Empty, Field, H, Screen, Scroll, Sheet, T, Tag, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { Address, useAuth } from '@/lib/auth';
import { c } from '@/lib/theme';

export default function Addresses() {
  const { me, refreshMe } = useAuth();
  const toast = useToast();
  const [edit, setEdit] = useState<Partial<Address> | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!edit?.line1?.trim() || !edit.areaName?.trim()) return toast('Add the house / street and area');
    setBusy(true);
    try {
      const body = { label: edit.label || 'Home', line1: edit.line1.trim(), line2: edit.areaName.trim(), areaName: edit.areaName.trim(), city: edit.city?.trim() || 'New Delhi', pincode: edit.pincode?.trim() ?? '' };
      if (edit.id) await api(`/me/addresses/${edit.id}`, { method: 'PATCH', body });
      else await api('/me/addresses', { body: { ...body, isDefault: !me?.addresses.length } });
      await refreshMe();
      setEdit(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (id: string) => {
    await api(`/me/addresses/${id}`, { method: 'PATCH', body: { isDefault: true } });
    await refreshMe();
    toast('Default address updated');
  };

  const remove = async (id: string) => {
    await api(`/me/addresses/${id}`, { method: 'DELETE' });
    await refreshMe();
    setEdit(null);
  };

  return (
    <Screen>
      <TopBar title="Saved addresses" subtitle="Pros come to your default address" large right={<Btn label="Add" size="sm" variant="soft" onPress={() => setEdit({ city: 'New Delhi', label: 'Home' })} style={{ minHeight: 36 }} />} />
      <Scroll contentStyle={{ paddingTop: 10, gap: 10 }}>
        {!me?.addresses.length && <Empty glyph="◎" title="No address yet" line="Add where providers should come." action="Add address" onAction={() => setEdit({ city: 'New Delhi', label: 'Home' })} />}
        {me?.addresses.map((a) => (
          <Card key={a.id} onPress={() => setEdit(a)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <T w="heavy" size={14} style={{ flex: 1 }}>{a.label}</T>
              {a.isDefault ? <Tag label="Default" green /> : (
                <Pressable onPress={() => makeDefault(a.id)} hitSlop={6}>
                  <T w="bold" size={12} color={c.a700}>Make default</T>
                </Pressable>
              )}
            </View>
            <T size={13} color={c.n800} style={{ lineHeight: 19 }}>{a.line1}, {a.areaName || a.line2}{'\n'}{a.city} {a.pincode}</T>
          </Card>
        ))}
      </Scroll>
      <Sheet visible={!!edit} onClose={() => setEdit(null)}>
        <H size={22} style={{ marginBottom: 14 }}>{edit?.id ? 'Edit address' : 'New address'}</H>
        <Field label="Label" value={edit?.label} onChangeText={(t) => setEdit((e) => ({ ...e, label: t }))} placeholder="Home, Office…" />
        <View style={{ height: 10 }} />
        <Field label="House / flat, street" value={edit?.line1} onChangeText={(t) => setEdit((e) => ({ ...e, line1: t }))} />
        <View style={{ height: 10 }} />
        <Field label="Area" value={edit?.areaName} onChangeText={(t) => setEdit((e) => ({ ...e, areaName: t }))} />
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <Field label="City" value={edit?.city} onChangeText={(t) => setEdit((e) => ({ ...e, city: t }))} style={{ flex: 1 }} />
          <Field label="PIN" value={edit?.pincode} onChangeText={(t) => setEdit((e) => ({ ...e, pincode: t }))} keyboardType="number-pad" maxLength={6} style={{ width: 110 }} />
        </View>
        <Btn label="Save address" loading={busy} onPress={save} />
        {!!edit?.id && <Btn label="Delete address" variant="ghost" textStyle={{ color: c.n600 }} onPress={() => remove(edit.id!)} />}
      </Sheet>
    </Screen>
  );
}
