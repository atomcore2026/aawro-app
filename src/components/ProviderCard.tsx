import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { money } from '@/lib/format';
import { c, radius, shadow } from '@/lib/theme';
import type { ProviderCard as P } from '@/lib/types';
import { Btn, Img, T } from './ui';

export function availabilityLabel(nextOpen: string | null) {
  if (!nextOpen) return 'No open slots this week';
  const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 330 * 60_000 + 86400_000).toISOString().slice(0, 10);
  if (nextOpen === today) return 'Available today';
  if (nextOpen === tomorrow) return 'Available tomorrow';
  const d = new Date(`${nextOpen}T00:00:00Z`);
  return `Next open ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]}`;
}

/** Provider card from the provider list in the design. */
export function ProviderCardView({ p, saved, onToggleSave, serviceId }: { p: P; saved?: boolean; onToggleSave?: () => void; serviceId?: string }) {
  const open = () => router.push(`/provider/${p.id}`);
  const book = () => router.push({ pathname: '/book/[providerId]', params: { providerId: p.id, serviceId: serviceId ?? p.service?.id ?? '' } });
  return (
    <View style={[{ backgroundColor: c.n100, borderRadius: radius.md, overflow: 'hidden' }, shadow.sm]}>
      <Pressable onPress={open} style={{ flexDirection: 'row', gap: 13, padding: 12 }}>
        <View style={{ width: 88, gap: 6 }}>
          <Img uri={p.coverUrl ?? p.photoUrl} radius={18} style={{ width: 88, height: 88 }} />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {p.thumbs.slice(0, 3).map((t, i) => (
              <Img key={i} uri={t} radius={6} style={{ flex: 1, height: 24 }} />
            ))}
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <T w="heavy" size={15.5} style={{ flex: 1, lineHeight: 19 }}>{p.name}</T>
            {onToggleSave && (
              <Pressable hitSlop={10} onPress={onToggleSave} accessibilityLabel={saved ? 'Remove from saved' : 'Save provider'}>
                <T size={17} color={c.a600}>{saved ? '♥' : '♡'}</T>
              </Pressable>
            )}
          </View>
          {p.verified && <T w="heavy" size={11} color={c.g700}>✓ VERIFIED PRO</T>}
          {!!p.service && <T w="bold" size={12.5} numberOfLines={1}>{p.service.name}</T>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <T w="heavy" size={12}>★ {p.rating.toFixed(1)}</T>
            <T size={12} color={c.n600}>{p.reviewCount} reviews</T>
            <T size={12} color={c.n600}>{p.years} yrs</T>
          </View>
          <T size={12} color={c.n600} numberOfLines={1}>
            {p.areaName}
            {p.distanceKm != null ? ` · ${p.distanceKm} km` : ''}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            <T w="heavy" size={16} color={c.a700}>
              {money(p.service?.rate ?? p.fromRate)}
              {(p.service?.unit ?? p.unit) === 'DAY' ? '/day' : '/hr'}
            </T>
            <T w="bold" size={11.5} color={c.g700}>{availabilityLabel(p.nextOpen)}</T>
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 9, paddingHorizontal: 12, paddingBottom: 12 }}>
        <Btn label="View profile" variant="outline" size="sm" onPress={open} style={{ flex: 1 }} />
        <Btn label="Check availability" size="sm" onPress={book} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
