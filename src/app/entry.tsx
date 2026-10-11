import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { H, T } from '@/components/ui';
import { c, font, shadow } from '@/lib/theme';

/** Shared entry: the role picked here is stored on the account for good. */
export default function Entry() {
  const go = (role: 'CUSTOMER' | 'PROVIDER') => router.push({ pathname: '/login', params: { role } });
  return (
    <View style={{ flex: 1, backgroundColor: c.a100, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: -130, right: -90, width: 340, height: 340, borderRadius: 999, backgroundColor: c.a200 }} />
      <View style={{ position: 'absolute', top: 120, left: -120, width: 230, height: 230, borderRadius: 999, backgroundColor: c.g200 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 30, paddingBottom: 24 }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={[{ width: 74, height: 74, borderRadius: 999, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, shadow.lg]}>
            <T size={36} color={c.a100} style={{ fontFamily: font.bold, lineHeight: 42 }}>A</T>
          </View>
          <H size={58} style={{ marginTop: 28, letterSpacing: -1.5, lineHeight: 60 }}>AAWRO</H>
          <T size={21} color={c.n800} style={{ marginTop: 14, maxWidth: 250, lineHeight: 28 }}>Book a pro. Or get booked.</T>
        </View>
        <View style={{ gap: 11 }}>
          <EntryButton label="I need a service" primary onPress={() => go('CUSTOMER')} />
          <EntryButton label="I provide a service" onPress={() => go('PROVIDER')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function EntryButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: primary ? c.accent : c.n100, borderRadius: 999, paddingVertical: 20, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        primary ? shadow.md : shadow.sm,
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      <T w="bold" size={17} color={primary ? c.a100 : c.text}>{label}</T>
      <T size={22} color={primary ? c.a100 : c.text}>→</T>
    </Pressable>
  );
}
