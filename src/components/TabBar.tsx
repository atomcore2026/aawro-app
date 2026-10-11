import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from '@/lib/theme';
import { Icon, T } from './ui';

export interface TabSpec {
  name: string;
  label: string;
  icon: string;
  badge?: number;
}

/** Bottom navigation exactly as in the design: icon, label, blue when active, badge. */
export function TabBar({ state, navigation, tabs }: BottomTabBarProps & { tabs: TabSpec[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.n100, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 9, paddingHorizontal: 6, paddingBottom: Math.max(12, insets.bottom) }}>
      {state.routes.map((route, index) => {
        const spec = tabs.find((t) => t.name === route.name);
        if (!spec) return null;
        const focused = state.index === index;
        const color = focused ? c.a700 : c.n600;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={spec.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}
          >
            <View style={{ height: 24, justifyContent: 'center' }}>
              <Icon d={spec.icon} size={23} color={color} stroke={2.75} />
              {!!spec.badge && (
                <View style={{ position: 'absolute', top: -3, right: -10, minWidth: 16, height: 16, borderRadius: 999, backgroundColor: c.a600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <T w="heavy" size={10} color="#fff" style={{ lineHeight: 12 }}>{spec.badge > 99 ? '99+' : spec.badge}</T>
                </View>
              )}
            </View>
            <T w="bold" size={10} color={color}>{spec.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
