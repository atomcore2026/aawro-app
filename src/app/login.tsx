import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BackButton, Btn, Field, H, Screen, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { Role, useAuth } from '@/lib/auth';
import { c } from '@/lib/theme';

export default function Login() {
  const { role = 'CUSTOMER' } = useLocalSearchParams<{ role: Role }>();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const provider = role === 'PROVIDER';

  const send = async () => {
    setError(null);
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) return setError('Enter your 10-digit mobile number');
    setBusy(true);
    try {
      const r = await requestOtp(digits, role);
      router.push({ pathname: '/otp', params: { phone: digits, role, name, devCode: r.devCode ?? '' } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 16, paddingBottom: 20 }}>
        <BackButton />
        {provider && (
          <View style={{ alignSelf: 'flex-start', marginTop: 24, backgroundColor: c.g100, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 }}>
            <T w="semibold" size={11.5} color={c.g800}>Provider app</T>
          </View>
        )}
        <H size={provider ? 31 : 32} style={{ marginTop: provider ? 14 : 26, marginBottom: 6 }}>
          {provider ? 'Log in to your workspace' : 'Welcome to AAWRO'}
        </H>
        <T size={14.5} color={c.n700} style={{ marginBottom: 26 }}>
          {provider ? 'Your services, rates and calendar live here. Customers only see what you publish.' : 'We will send a 6-digit code to verify your number.'}
        </T>
        <Field label={provider ? 'Registered phone' : 'Phone number'} value={phone} onChangeText={setPhone} placeholder="+91 00000 00000" keyboardType="phone-pad" autoComplete="tel" maxLength={16} />
        <View style={{ height: 14 }} />
        <Field label={provider ? 'Your name (new accounts)' : 'Name'} value={name} onChangeText={setName} placeholder="Your full name" autoComplete="name" />
        {!!error && <T size={13} color={c.danger} style={{ marginTop: 12 }}>{error}</T>}
        <View style={{ flex: 1 }} />
        <Btn label="Send code" size="lg" onPress={send} loading={busy} />
        <T size={11.5} color={c.n600} style={{ textAlign: 'center', marginTop: 14 }}>By continuing you accept the AAWRO terms of service.</T>
      </View>
    </Screen>
  );
}
