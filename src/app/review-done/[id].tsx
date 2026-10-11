import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Btn, H, Loading, Screen, T } from '@/components/ui';
import { stars } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { c, radius } from '@/lib/theme';

export default function ReviewDone() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b } = useBooking(id);
  if (!b) return <Screen><Loading /></Screen>;
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 30 }}>
        <View style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: c.g300, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <T size={40} color={c.g900}>✓</T>
        </View>
        <H size={29} style={{ textAlign: 'center', marginTop: 22, marginBottom: 8 }}>Review submitted</H>
        <T size={14.5} color={c.n700} style={{ textAlign: 'center', marginBottom: 8 }}>Your rating is now on {b.provider?.name}'s profile. Booking {b.code} is closed.</T>
        {b.review && (
          <View style={{ backgroundColor: c.n100, borderRadius: radius.lg, padding: 16, marginTop: 14 }}>
            <T w="heavy" size={14}>{stars(b.review.rating)}</T>
            {!!b.review.text && <T size={13} color={c.n800} style={{ marginTop: 6, lineHeight: 19 }}>{b.review.text}</T>}
          </View>
        )}
        <Btn label="See it on the profile" onPress={() => router.replace(`/provider/${b.provider?.id}`)} style={{ marginTop: 20 }} />
        <Btn label="Back to home" variant="ghost" onPress={() => router.replace('/(customer)/home')} />
      </View>
    </Screen>
  );
}
