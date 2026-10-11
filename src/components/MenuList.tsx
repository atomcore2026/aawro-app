import { Pressable, View } from 'react-native';
import { c, radius } from '@/lib/theme';
import { T } from './ui';

export interface MenuItem {
  label: string;
  glyph: string;
  tone: string;
  meta?: string;
  onPress: () => void;
}

/** Grouped settings rows with a glyph tile, label, meta and chevron. */
export function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <View style={{ marginTop: 14, backgroundColor: c.n100, borderRadius: radius.md, overflow: 'hidden' }}>
      {items.map((r, i) => (
        <Pressable key={r.label} onPress={r.onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: c.divider, backgroundColor: pressed ? c.bg : c.n100 })}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: r.tone, alignItems: 'center', justifyContent: 'center' }}>
            <T size={14}>{r.glyph}</T>
          </View>
          <T w="semibold" size={14} style={{ flex: 1 }}>{r.label}</T>
          {!!r.meta && <T size={12} color={c.n600}>{r.meta}</T>}
          <T size={16} color={c.n500}>›</T>
        </Pressable>
      ))}
    </View>
  );
}
