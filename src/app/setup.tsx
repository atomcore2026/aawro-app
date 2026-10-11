import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Field, H, Screen, Scroll, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { c } from '@/lib/theme';

/** Customer onboarding: name, email and the service address. */
export default function Setup() {
  const { me, refreshMe } = useAuth();
  const [name, setName] = useState(me?.name ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [line1, setLine1] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError('Add your name');
    if (line1.trim().length < 3 || !area.trim()) return setError('Add your house / street and area');
    setBusy(true);
    setError(null);
    try {
      await api('/me', { method: 'PATCH', body: { name: name.trim(), email: email.trim() } });
      if (!me?.defaultAddress) {
        await api('/me/addresses', { body: { line1: line1.trim(), line2: area.trim(), areaName: area.trim(), city: city.trim(), pincode: pin.trim(), isDefault: true } });
      }
      await refreshMe();
      router.replace('/(customer)/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Scroll contentStyle={{ paddingHorizontal: 26, paddingTop: 30 }}>
        <View style={{ height: 5, borderRadius: 999, backgroundColor: c.n300, overflow: 'hidden' }}>
          <View style={{ width: '66%', height: '100%', backgroundColor: c.g500 }} />
        </View>
        <H size={30} style={{ marginTop: 22, marginBottom: 6 }}>Where should pros come?</H>
        <T size={14.5} color={c.n700} style={{ marginBottom: 22 }}>We only show providers who serve your area.</T>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
        <View style={{ height: 12 }} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="Optional" />
        <View style={{ height: 12 }} />
        <Field label="House / flat, street" value={line1} onChangeText={setLine1} placeholder="B-42, Second Floor" autoComplete="street-address" />
        <View style={{ height: 12 }} />
        <Field label="Area" value={area} onChangeText={setArea} placeholder="Greater Kailash 1" />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label="City" value={city} onChangeText={setCity} style={{ flex: 1 }} />
          <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} style={{ width: 110 }} />
        </View>
        {!!error && <T size={13} color={c.danger} style={{ marginTop: 12 }}>{error}</T>}
        <Btn label="Start browsing" size="lg" onPress={save} loading={busy} style={{ marginTop: 24 }} />
      </Scroll>
    </Screen>
  );
}
