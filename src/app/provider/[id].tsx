import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar, BackButton, Btn, ErrorState, Footer, H, Img, Kicker, Loading, Screen, T, Tag, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { agoLong, money, stars, unitLabel } from '@/lib/format';
import { useProviderProfile, useSaved } from '@/lib/queries';
import { watchProvider } from '@/lib/socket';
import { c, radius, shadow } from '@/lib/theme';
import type { Service } from '@/lib/types';

/** Public provider profile (also used as the provider's own preview). */
export default function ProviderScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const { me } = useAuth();
  const toast = useToast();
  const saved = useSaved();
  const { data: p, isLoading, error, refetch } = useProviderProfile(id);
  const [picked, setPicked] = useState<Service | null>(null);
  const isPreview = preview === '1' || me?.role === 'PROVIDER';

  useEffect(() => (id ? watchProvider(id) : undefined), [id]);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (error || !p) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;

  const service = picked ?? p.services[0];
  const from = p.services.reduce((m, s) => (m === null || s.rate < m.rate ? s : m), null as Service | null);
  const isSaved = saved.ids.has(p.id);

  return (
    <Screen edges={[]}>
      {isPreview && (
        <View style={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.g200 }}>
          <BackButton light />
          <T w="heavy" size={12.5} color={c.g900} style={{ flex: 1 }}>Preview mode · this is the customer's view</T>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Img uri={p.coverUrl ?? p.photoUrl} style={{ height: 215 }} />
          {!isPreview && (
            <>
              <View style={{ position: 'absolute', top: 52, left: 16 }}>
                <BackButton light />
              </View>
              <Pressable
                accessibilityLabel={isSaved ? 'Remove from saved' : 'Save provider'}
                onPress={async () => toast((await saved.toggle(p.id)) ? 'Saved to your list' : 'Removed from saved')}
                style={[{ position: 'absolute', top: 52, right: 16, width: 38, height: 38, borderRadius: 999, backgroundColor: c.n100, alignItems: 'center', justifyContent: 'center' }, shadow.sm]}
              >
                <T size={17} color={c.a600}>{isSaved ? '♥' : '♡'}</T>
              </Pressable>
            </>
          )}
        </View>
        <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, marginTop: -26, backgroundColor: c.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <H size={26} style={{ flex: 1 }}>{p.name}</H>
            {p.verified && <Tag label="✓ Verified" green />}
          </View>
          <T size={13.5} color={c.n700} style={{ marginTop: 6 }}>{p.person} · {p.areaName}</T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {[
              [p.rating.toFixed(1), 'Rating'],
              [String(p.reviewCount), 'Reviews'],
              [String(p.jobs), 'Jobs'],
              [`${p.years}y`, 'Exp.'],
            ].map(([v, k]) => (
              <View key={k} style={{ flex: 1, backgroundColor: c.n100, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
                <T w="heavy" size={16}>{v}</T>
                <T size={10} color={c.n600}>{k}</T>
              </View>
            ))}
          </View>
          {!!p.about && <T size={14} color={c.n800} style={{ marginTop: 18, lineHeight: 21 }}>{p.about}</T>}

          <Kicker style={{ marginTop: 20 }}>Categories</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {p.categories.map((cat) => <Tag key={cat.id} label={cat.name} />)}
          </View>

          <Kicker>Services and rates</Kicker>
          <View style={{ gap: 8 }}>
            {p.services.map((s) => (
              <Pressable key={s.id} onPress={() => setPicked(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.n100, borderRadius: radius.md, padding: 13, borderWidth: 1.5, borderColor: service?.id === s.id && !isPreview ? c.accent : c.n100 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="bold" size={14.5}>{s.name}</T>
                  {!!s.description && <T size={12} color={c.n700} style={{ marginTop: 2 }}>{s.description}</T>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T w="heavy" size={14.5} color={c.a700}>{money(s.rate)}</T>
                  <T size={10.5} color={c.n600}>{unitLabel(s.unit)}</T>
                </View>
              </Pressable>
            ))}
          </View>

          <Kicker>Availability</Kicker>
          <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.g200, alignItems: 'center', justifyContent: 'center' }}>
              <T size={19}>⏰</T>
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" size={14}>{p.availability.daysLabel}</T>
              <T size={12.5} color={c.n700}>{p.availability.hoursLabel}</T>
            </View>
          </View>

          {!!p.portfolio.length && (
            <>
              <Kicker>Recent work</Kicker>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {p.portfolio.map((w) => (
                  <View key={w.id} style={{ width: 172 }}>
                    <Img uri={w.imageUrl} radius={16} style={{ width: 172, height: 120 }} />
                    <T size={11.5} color={c.n700} style={{ marginTop: 6, lineHeight: 15 }}>{w.caption}</T>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <Kicker style={{ marginTop: 24 }} right={<T w="bold" size={13}>★ {p.rating.toFixed(1)} of 5</T>}>
            Reviews
          </Kicker>
          <View style={{ gap: 10 }}>
            {p.reviews.map((r) => (
              <View key={r.id} style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Avatar name={r.by} size={32} bg={c.n300} fg={c.n800} />
                  <View style={{ flex: 1 }}>
                    <T w="bold" size={13.5}>{r.by}</T>
                    <T size={11} color={c.n600}>{r.service} · {agoLong(r.createdAt)}</T>
                  </View>
                  <T w="heavy" size={12}>{stars(r.rating)}</T>
                </View>
                {!!r.text && <T size={13} color={c.n800} style={{ marginTop: 10, lineHeight: 19 }}>{r.text}</T>}
                {!!r.reply && (
                  <View style={{ marginTop: 10, backgroundColor: c.bg, borderRadius: 12, padding: 10 }}>
                    <T w="bold" size={11.5} color={c.n700}>Reply from {p.person.split(' ')[0]}</T>
                    <T size={12.5} color={c.n800} style={{ marginTop: 3 }}>{r.reply}</T>
                  </View>
                )}
              </View>
            ))}
            {!p.reviews.length && <T size={13} color={c.n600}>No reviews on AAWRO yet.</T>}
          </View>
        </View>
      </ScrollView>
      {!isPreview && (
        <Footer style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View>
            <T size={11} color={c.n600}>From</T>
            <T w="heavy" size={17} color={c.a700}>{from ? `${money(from.rate)}${from.unit === 'DAY' ? '/day' : '/hr'}` : '—'}</T>
          </View>
          <Btn
            label="Check availability"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/book/[providerId]', params: { providerId: p.id, serviceId: service?.id ?? '' } })}
            disabled={!service}
          />
        </Footer>
      )}
    </Screen>
  );
}
