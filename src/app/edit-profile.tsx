import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Field, Footer, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { c, radius } from '@/lib/theme';

export default function EditProfile() {
  const { me, refreshMe } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(me?.name ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api('/me', { method: 'PATCH', body: { name: name.trim(), email: email.trim() } });
      await refreshMe();
      toast('Profile saved');
      router.back();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Edit profile" subtitle={me?.role === 'PROVIDER' ? 'Your account details' : 'Providers see your name and address'} />
      <Scroll contentStyle={{ paddingTop: 12 }}>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
        <View style={{ height: 13 }} />
        <Field label="Phone number" value={me?.phoneDisplay} editable={false} />
        <T size={11.5} color={c.n600} style={{ marginTop: 5, marginLeft: 4 }}>Your login number. Contact support to change it.</T>
        <View style={{ height: 13 }} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" />
        {me?.role === 'CUSTOMER' && (
          <View style={{ backgroundColor: c.a100, borderRadius: radius.md, padding: 13, marginTop: 16 }}>
            <T size={12.5} color={c.a900}>Service addresses are managed under Profile → Saved addresses.</T>
            <Btn label="Manage addresses" variant="ghost" size="sm" onPress={() => router.push('/addresses')} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
          </View>
        )}
      </Scroll>
      <Footer>
        <Btn label="Save changes" size="lg" loading={busy} onPress={save} disabled={!name.trim()} />
      </Footer>
    </Screen>
  );
}
