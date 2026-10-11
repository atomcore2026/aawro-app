import { View } from 'react-native';
import { money } from '@/lib/format';
import { c } from '@/lib/theme';
import { T } from './ui';

export function metaFor(cat: { proCount: number; fromRate: number | null; unit: 'HOUR' | 'DAY' }) {
  if (!cat.proCount) return 'No pros yet in your area';
  return `From ${money(cat.fromRate)}${cat.unit === 'DAY' ? '/day' : '/hr'} · ${cat.proCount} pro${cat.proCount > 1 ? 's' : ''}`;
}

export function Chevron() {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: c.a200, alignItems: 'center', justifyContent: 'center' }}>
      <T size={17} color={c.a800} style={{ lineHeight: 20 }}>›</T>
    </View>
  );
}
