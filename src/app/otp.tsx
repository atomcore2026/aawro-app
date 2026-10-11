import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { BackButton, Btn, H, Screen, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { Role, useAuth } from '@/lib/auth';
import { c, font, radius } from '@/lib/theme';

export default function Otp() {
  const params = useLocalSearchParams<{ phone: string; role: Role; name?: string; devCode?: string }>();
  const { verifyOtp, requestOtp } = useAuth();
  const [code, setCode] = useState(params.devCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async () => {
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setBusy(true);
    setError(null);
    try {
      const { me } = await verifyOtp(params.phone, code, params.role, params.name);
      if (me.role === 'PROVIDER') router.replace(me.provider?.status === 'DRAFT' ? '/onboarding' : '/(provider)/dashboard');
      else router.replace(!me.name || !me.defaultAddress ? '/setup' : '/(customer)/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not verify');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const r = await requestOtp(params.phone, params.role);
      setWait(30);
      if (r.devCode) setCode(r.devCode);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend');
    }
  };

  const display = `+91 ${params.phone?.slice(0, 5)} ${params.phone?.slice(5)}`;
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 16, paddingBottom: 20 }}>
        <BackButton />
        <H size={32} style={{ marginTop: 26, marginBottom: 6 }}>Verify your number</H>
        <T size={14.5} color={c.n700} style={{ marginBottom: 26 }}>
          Code sent to {display}.{params.devCode ? ' Demo code is prefilled.' : ''}
        </T>
        <Pressable onPress={() => input.current?.focus()} style={{ flexDirection: 'row', gap: 9 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                aspectRatio: 1 / 1.15,
                borderRadius: radius.md,
                backgroundColor: c.n100,
                borderWidth: 1.5,
                borderColor: code.length === i ? c.accent : c.n300,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T w="bold" size={24}>{code[i] ?? ''}</T>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={input}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          autoFocus={!params.devCode}
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1, fontFamily: font.regular }}
        />
        {wait > 0 ? (
          <T size={13} color={c.n600} style={{ marginTop: 18 }}>Resend code in 0:{String(wait).padStart(2, '0')}</T>
        ) : (
          <Pressable onPress={resend} style={{ marginTop: 18 }}>
            <T w="bold" size={13} color={c.a700}>Resend code</T>
          </Pressable>
        )}
        {!!error && <T size={13} color={c.danger} style={{ marginTop: 12 }}>{error}</T>}
        <View style={{ flex: 1 }} />
        <Btn label="Verify and continue" size="lg" onPress={verify} loading={busy} />
      </View>
    </Screen>
  );
}
