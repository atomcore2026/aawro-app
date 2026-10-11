import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Avatar, Icon, ICON, Img, Screen, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { greeting } from '@/lib/format';
import { c, radius, shadow } from '@/lib/theme';
import type { Category } from '@/lib/types';

interface Home {
  heroes: { id: string; categoryId: string; kicker: string; headline: string; imageUrl: string }[];
  tiles: Category[];
  counts: { groups: number; categories: number; providers: number };
}

export default function HomeScreen() {
  const { me } = useAuth();
  const { data, refetch, isRefetching } = useQuery({ queryKey: ['home'], queryFn: () => api<Home>('/catalog/home') });

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T size={12} color={c.n600} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>{greeting()}{me?.name ? `, ${me.name.split(' ')[0]}` : ''}</T>
          <Pressable onPress={() => router.push('/addresses')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <T w="bold" size={16} color={c.a700}>◎</T>
            <T w="bold" size={16} numberOfLines={1} style={{ flexShrink: 1 }}>{me?.locality ?? 'Add your address'}</T>
            <T size={11} color={c.n600}>▾</T>
          </Pressable>
        </View>
        <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={[{ width: 42, height: 42, borderRadius: 999, backgroundColor: c.n100, alignItems: 'center', justifyContent: 'center' }, shadow.sm]}>
          <Icon d={ICON.bell} size={21} stroke={2.75} />
          {!!me?.unreadNotifications && <View style={{ position: 'absolute', top: 7, right: 8, width: 9, height: 9, borderRadius: 999, backgroundColor: c.a600, borderWidth: 2, borderColor: c.n100 }} />}
        </Pressable>
        <Pressable onPress={() => router.push('/(customer)/profile')}>
          <Avatar name={me?.name} size={42} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <Pressable onPress={() => router.push('/search')} style={[{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: c.n100, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 20 }, shadow.sm]}>
            <Icon d={ICON.search} size={19} color={c.n600} stroke={2.75} />
            <T size={14.5} color={c.n600}>What do you need help with?</T>
          </Pressable>
        </View>

        {!!data?.heroes.length && <Heroes heroes={data.heroes} />}

        <View style={{ paddingHorizontal: 18, paddingTop: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <T size={21} style={{ letterSpacing: -0.3 }}>Popular services</T>
            <Pressable onPress={() => router.push('/(customer)/explore')}>
              <T w="bold" size={13} color={c.a700}>See all</T>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {(data?.tiles ?? []).map((t) => (
              <Pressable key={t.id} onPress={() => router.push(`/category/${t.id}`)} style={{ width: '25%', paddingHorizontal: 5, marginBottom: 16, alignItems: 'center', gap: 7 }}>
                <View style={[{ width: '100%', aspectRatio: 1, borderRadius: 22, padding: 3, backgroundColor: c.n100 }, shadow.sm]}>
                  <Img uri={t.imageUrl} radius={19} style={{ flex: 1 }} />
                </View>
                <T w="bold" size={11} style={{ textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>{t.name}</T>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
          <View style={{ overflow: 'hidden', borderRadius: radius.lg, backgroundColor: c.g200, padding: 20, paddingTop: 22 }}>
            <View style={{ position: 'absolute', right: -46, top: -46, width: 150, height: 150, borderRadius: 999, backgroundColor: c.g300 }} />
            <View style={{ position: 'absolute', right: 34, top: 58, width: 34, height: 34, borderRadius: 999, backgroundColor: c.a300 }} />
            <T w="heavy" size={10.5} color={c.g800} style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>How AAWRO works</T>
            <T size={23} color={c.g900} style={{ marginTop: 6, marginBottom: 18, maxWidth: 220, lineHeight: 26, letterSpacing: -0.3 }}>Booked in three taps. Paid when it's done.</T>
            {[
              ['Pick a pro', 'See ratings, past work and the fixed price.'],
              ['Choose an open slot', "Real availability. Once confirmed, it's yours."],
              ['Pay after the job', "Chat inside the booking, pay once it's complete."],
            ].map(([t, s], i) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: i < 2 ? 14 : 0 }}>
                <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: c.n100, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={17} color={c.g800}>{i + 1}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={14} color={c.g900}>{t}</T>
                  <T size={12} color={c.g900}>{s}</T>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', gap: 8 }}>
          {[
            [ICON.shield, 'Verified pros'],
            [ICON.tag, 'Fixed prices, no bidding'],
            [ICON.chat, 'Chat in every booking'],
          ].map(([d, label]) => (
            <View key={label} style={[{ flex: 1, backgroundColor: c.n100, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 6 }, shadow.sm]}>
              <Icon d={d} size={22} color={c.a700} stroke={2.75} />
              <T w="bold" size={11.5} style={{ textAlign: 'center', lineHeight: 14 }}>{label}</T>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: 18, paddingTop: 26 }}>
          <Pressable onPress={() => router.push('/(customer)/explore')} style={{ backgroundColor: c.text, borderRadius: 999, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <T w="bold" size={14} color={c.bg}>View all {data?.counts.categories ?? 300} services</T>
            <T size={16} color={c.bg}>→</T>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Heroes({ heroes }: { heroes: Home['heroes'] }) {
  const width = Dimensions.get('window').width - 36;
  const ref = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (dragging.current) return;
      setIdx((i) => {
        const n = (i + 1) % heroes.length;
        ref.current?.scrollTo({ x: n * width, animated: true });
        return n;
      });
    }, 4200);
    return () => clearInterval(t);
  }, [heroes.length, width]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    setIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
      <View style={[{ height: 262, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.n400 }, shadow.md]}>
        <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => (dragging.current = true)} onMomentumScrollEnd={onEnd}>
          {heroes.map((h) => (
            <Pressable key={h.id} onPress={() => router.push(`/category/${h.categoryId}`)} style={{ width, height: 262 }}>
              <Img uri={h.imageUrl} style={{ flex: 1 }} fallback={c.n400}>
                <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 40, backgroundColor: 'rgba(9,17,35,0.38)' }}>
                  <T w="heavy" size={10.5} color="#fff" style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>{h.kicker}</T>
                  <T w="bold" size={27} color="#fff" style={{ marginTop: 9, maxWidth: 240, lineHeight: 29 }}>{h.headline}</T>
                </View>
              </Img>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ position: 'absolute', left: 24, bottom: 16, flexDirection: 'row', gap: 6 }}>
          {heroes.map((h, i) => (
            <View key={h.id} style={{ height: 7, width: i === idx ? 22 : 7, borderRadius: 999, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </View>
      </View>
    </View>
  );
}
