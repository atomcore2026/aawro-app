import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { c } from '@/lib/theme';

/** Routes a session to the right app: entry, customer, or provider. */
export default function Gate() {
  const { status, me } = useAuth();
  if (status === 'loading') return <View style={{ flex: 1, backgroundColor: c.a100 }} />;
  if (status === 'signedOut' || !me) return <Redirect href="/entry" />;
  if (me.role === 'PROVIDER') {
    return me.provider?.status === 'DRAFT' ? <Redirect href="/onboarding" /> : <Redirect href="/(provider)/dashboard" />;
  }
  if (!me.name || !me.defaultAddress) return <Redirect href="/setup" />;
  return <Redirect href="/(customer)/home" />;
}
