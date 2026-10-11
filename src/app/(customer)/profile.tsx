import { router } from 'expo-router';
import { Alert, Platform, View } from 'react-native';
import { MenuList } from '@/components/MenuList';
import { Avatar, Btn, H, Screen, Scroll, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { c, radius } from '@/lib/theme';

export default function Profile() {
  const { me, signOut, refreshMe } = useAuth();
  if (!me) return null;
  const addr = me.defaultAddress;

  const deleteAccount = () => {
    const run = async () => {
      try {
        await api('/me', { method: 'DELETE' });
        await signOut();
        router.replace('/entry');
      } catch (e) {
        const msg = (e as Error).message;
        if (Platform.OS === 'web') globalThis.alert?.(msg);
        else Alert.alert('Could not delete account', msg);
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Delete your AAWRO account? Booking and payment records are kept for tax purposes.')) run();
    } else {
      Alert.alert('Delete account?', 'Your profile is anonymised. Booking and payment records are kept for 8 years for tax purposes.', [
        { text: 'Keep account', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: run },
      ]);
    }
  };

  return (
    <Screen>
      <Scroll contentStyle={{ paddingTop: 16 }} onRefresh={refreshMe}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar name={me.name} size={68} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <H size={23}>{me.name || 'Your name'}</H>
            <T size={12.5} color={c.n700} style={{ marginTop: 4 }}>{me.phoneDisplay}</T>
            {!!me.email && <T size={12.5} color={c.n700}>{me.email}</T>}
          </View>
          <Btn label="Edit" variant="soft" size="sm" onPress={() => router.push('/edit-profile')} style={{ minHeight: 36, paddingHorizontal: 15 }} />
        </View>
        <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14, marginTop: 18 }}>
          <T w="heavy" size={11} color={c.n600} style={{ letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Service address</T>
          <T size={13.5} style={{ lineHeight: 20 }}>
            {addr ? `${addr.line1}, ${addr.areaName || addr.line2}\n${addr.city} ${addr.pincode}` : 'No address yet'}
          </T>
        </View>
        {me.paymentHold && (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: radius.md, padding: 14, marginTop: 12 }}>
            <T w="bold" size={13} color="#991b1b">New bookings are paused until your pending payment is cleared.</T>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
          {[
            [String(me.stats.bookings), 'Bookings'],
            [String(me.stats.saved), 'Saved'],
            [String(me.stats.reviews), 'Reviews'],
          ].map(([v, k]) => (
            <View key={k} style={{ flex: 1, backgroundColor: c.n100, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
              <H size={20}>{v}</H>
              <T size={10.5} color={c.n600} style={{ marginTop: 2 }}>{k}</T>
            </View>
          ))}
        </View>
        <MenuList
          items={[
            { label: 'Saved providers', glyph: '♥', tone: c.a200, meta: String(me.stats.saved), onPress: () => router.push('/saved') },
            { label: 'Booking history', glyph: '▤', tone: c.n300, meta: String(me.stats.bookings), onPress: () => router.push('/(customer)/bookings') },
            { label: 'Payment history', glyph: '₹', tone: c.a200, onPress: () => router.push('/payments') },
            { label: 'Saved addresses', glyph: '◎', tone: c.g200, meta: String(me.addresses.length), onPress: () => router.push('/addresses') },
            { label: 'Notifications', glyph: '🔔', tone: c.n300, meta: me.unreadNotifications ? `${me.unreadNotifications} unread` : 'All read', onPress: () => router.push('/notifications') },
            { label: 'Edit my details', glyph: '✎', tone: c.a200, onPress: () => router.push('/edit-profile') },
            { label: 'Help & support', glyph: '?', tone: c.g200, onPress: () => router.push('/help') },
            { label: 'Recent searches', glyph: '⌕', tone: c.n300, meta: String(me.recentSearches.length), onPress: () => router.push('/search') },
          ]}
        />
        <Btn
          label="Log out"
          variant="outline"
          onPress={async () => {
            await signOut();
            router.replace('/entry');
          }}
          style={{ marginTop: 16 }}
        />
        <Btn label="Delete account" variant="ghost" size="sm" textStyle={{ color: c.n600 }} onPress={deleteAccount} />
        <T size={11} color={c.n600} style={{ textAlign: 'center', marginTop: 6 }}>AAWRO v1.0 · India</T>
      </Scroll>
    </Screen>
  );
}
