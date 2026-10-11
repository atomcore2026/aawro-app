import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { MenuList } from '@/components/MenuList';
import { Avatar, Btn, H, Loading, Screen, Scroll, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useProviderMe } from '@/lib/provider';
import { c, radius } from '@/lib/theme';

const VERIFY: Record<string, string> = { VERIFIED: '✓ Verified', PENDING: 'Verification pending', REUPLOAD: 'Re-upload needed', REJECTED: 'Not verified' };

export default function ProviderProfileTab() {
  const { signOut } = useAuth();
  const { data: p, refetch, isRefetching } = useProviderMe();
  if (!p) return <Screen><Loading /></Screen>;
  const live = p.services.filter((s) => s.published).length;

  return (
    <Screen>
      <Scroll contentStyle={{ paddingTop: 14 }} refreshing={isRefetching} onRefresh={refetch}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar uri={p.photoUrl} name={p.personName} size={68} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <H size={22}>{p.displayName}</H>
            <T size={12.5} color={c.n700} style={{ marginTop: 3 }}>{p.personName} · {p.yearsExperience} years · {p.code}</T>
            <T size={12.5} style={{ marginTop: 3 }}>
              <T w="heavy" size={12.5}>★ {p.stats.ratingCount ? p.stats.ratingAvg.toFixed(1) : 'New'}</T>
              <T size={12.5} color={c.n600}>  {p.stats.ratingCount} reviews · </T>
              <T size={12.5} color={p.verification === 'VERIFIED' ? c.g700 : c.n600}>{VERIFY[p.verification]}</T>
            </T>
          </View>
          <Btn label="Edit" variant="soft" size="sm" onPress={() => router.push('/business')} style={{ minHeight: 36, paddingHorizontal: 15 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>
          {[
            [String(p.stats.jobsCompleted), 'Jobs done'],
            [String(p.yearsExperience), 'Years'],
            [p.stats.profileViews.toLocaleString('en-IN'), 'Views'],
          ].map(([v, k]) => (
            <View key={k} style={{ flex: 1, backgroundColor: c.n100, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
              <H size={19}>{v}</H>
              <T size={10} color={c.n600} style={{ marginTop: 2 }}>{k}</T>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push({ pathname: '/provider/[id]', params: { id: p.id, preview: '1' } })} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: c.g200, borderRadius: radius.md, padding: 14 }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: c.g700, alignItems: 'center', justifyContent: 'center' }}>
            <T size={15} color="#fff">👁</T>
          </View>
          <View style={{ flex: 1 }}>
            <T w="heavy" size={13.5} color={c.g900}>Preview my public profile</T>
            <T size={11.5} color={c.g900} style={{ opacity: 0.8 }}>See what customers see</T>
          </View>
        </Pressable>
        <MenuList
          items={[
            { label: 'My services', glyph: '▤', tone: c.a200, meta: `${live} live`, onPress: () => router.push('/services') },
            { label: 'My categories', glyph: '◉', tone: c.n300, meta: `${p.categories.length} of ${p.limits.maxCategories}`, onPress: () => router.push('/categories') },
            { label: 'Availability', glyph: '⏰', tone: c.g200, meta: p.availabilitySummary.daysLabel, onPress: () => router.push('/availability') },
            { label: 'Earnings', glyph: '₹', tone: c.a200, onPress: () => router.push('/earnings') },
            { label: 'Reviews', glyph: '★', tone: c.g200, meta: p.stats.ratingCount ? p.stats.ratingAvg.toFixed(1) : '—', onPress: () => router.push('/reviews') },
            { label: 'Business details', glyph: '✎', tone: c.a200, onPress: () => router.push('/business') },
            { label: 'Portfolio, documents & payouts', glyph: '🖼', tone: c.n300, meta: `${p.portfolio.length} photos`, onPress: () => router.push({ pathname: '/onboarding', params: { step: '4', edit: '1' } }) },
            { label: 'Notifications', glyph: '🔔', tone: c.n300, onPress: () => router.push('/notifications') },
            { label: 'Help & support', glyph: '?', tone: c.g200, onPress: () => router.push('/help') },
          ]}
        />
        <Btn
          label="Log out"
          variant="outline"
          onPress={async () => {
            await signOut();
            router.replace('/entry');
          }}
          style={{ marginTop: 16 }}
        />
      </Scroll>
    </Screen>
  );
}
