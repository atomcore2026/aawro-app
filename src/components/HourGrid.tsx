import { Pressable, View } from 'react-native';
import { hourLabel } from '@/lib/format';
import { c } from '@/lib/theme';
import { T } from './ui';

/**
 * The design's hour grid: 4 columns of hour cells, tap to open or close.
 * Booked hours stay locked and say so.
 */
export function HourGrid({ open, locked = [], onToggle, from = 6, to = 22 }: { open: number[]; locked?: number[]; onToggle: (h: number) => void; from?: number; to?: number }) {
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {hours.map((h) => {
        const isLocked = locked.includes(h);
        const on = open.includes(h) || isLocked;
        const bg = isLocked ? c.g700 : on ? c.accent : c.n100;
        const fg = on ? '#fff' : c.n700;
        return (
          <Pressable
            key={h}
            onPress={() => !isLocked && onToggle(h)}
            accessibilityLabel={`${hourLabel(h)} ${isLocked ? 'booked' : on ? 'open' : 'closed'}`}
            style={{ width: '22.9%', borderRadius: 14, paddingTop: 10, paddingBottom: 9, alignItems: 'center', backgroundColor: bg, borderWidth: 1.5, borderColor: isLocked ? c.g700 : on ? c.accent : c.n300 }}
          >
            <T w="heavy" size={13} color={fg}>{hourLabel(h, false).replace(':00 ', ' ')}</T>
            <T w="bold" size={10} color={fg} style={{ marginTop: 2, opacity: on ? 1 : 0.8 }}>{isLocked ? 'Booked' : on ? 'Open' : 'Closed'}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
