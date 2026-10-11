import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Btn, H, Loading, Pill, Row, Screen, T } from '@/components/ui';
import { countdown, dateLabel, hourLabel, money } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { c, radius, shadow } from '@/lib/theme';

export default function Sent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b } = useBooking(id);
  if (!b) return <Screen><Loading /></Screen>;
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 30 }}>
        <View style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: c.g300, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <T size={42} color={c.g900}>✓</T>
        </View>
        <H size={30} style={{ textAlign: 'center', marginTop: 22, marginBottom: 8 }}>Request sent</H>
        <T size={14.5} color={c.n700} style={{ textAlign: 'center', marginBottom: 22 }}>
          Waiting for {b.provider?.person ?? b.provider?.name} to accept.{b.expiresAt ? ` Expires in ${countdown(b.expiresAt)}.` : ''}
        </T>
        <View style={[{ backgroundColor: c.n100, borderRadius: radius.lg, padding: 16 }, shadow.sm]}>
          <Row k="Service" v={b.serviceName} />
          <Row k="Provider" v={b.provider?.name ?? ''} />
          <Row k="When" v={`${dateLabel(b.dateKey)}, ${hourLabel(b.startHour, false)}`} />
          <Row k="Duration" v={b.durationLabel} />
          <Row k="Estimated" v={money(b.pricing.customerTotal, { decimals: true })} last />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.divider }}>
            <T size={12.5} color={c.n700}>Status</T>
            <Pill label="Waiting for provider" toneKey="blue" />
          </View>
        </View>
        <Btn label="View request status" onPress={() => router.replace(`/booking/${b.id}`)} style={{ marginTop: 20 }} />
        <Btn label="Back to home" variant="ghost" onPress={() => router.replace('/(customer)/home')} />
      </View>
    </Screen>
  );
}
