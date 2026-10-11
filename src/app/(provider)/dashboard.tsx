import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Btn, ErrorState, H, Icon, ICON, Loading, Pill, Screen, Scroll, T } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { countdown, greeting, hourLabel, money } from '@/lib/format';
import { c, radius, shadow } from '@/lib/theme';

interface Dashboard {
  greetingName: string;
  displayName: string;
  status: string;
  verification: string;
  newRequests: { count: number; soonestExpiry: string | null };
  stats: { weekEarnings: number; upcomingJobs: number; rating: number; ratingCount: number; acceptanceRate: number; profileViews: number; jobsCompleted: number };
  today: { id: string; code: string; status: string; startHour: number; hours: number; duration: string; serviceName: string; customerName: string }[];
  week: { bars: { date: string; label: string; amount: number }[]; total: number; jobs: number };
  nextPayout: { code: string; amount: number; status: string } | null;
}

const STATUS_TONE: Record<string, [string, string]> = {
  ACCEPTED: ['Confirmed', 'green'],
  UPCOMING: ['Confirmed', 'green'],
  IN_PROGRESS: ['In progress', 'amber'],
  COMPLETED: ['Awaiting payment', 'blue'],
  PAID: ['Paid', 'green'],
  REVIEWED: ['Completed', 'grey'],
};

export default function ProviderDashboard() {
  const { me } = useAuth();
  const { data: d, isLoading, error, refetch, isRefetching } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/provider/dashboard'), refetchInterval: 60_000 });

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T size={12} color={c.n600} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>{greeting()}{d?.greetingName ? `, ${d.greetingName}` : ''}</T>
          <H size={23} style={{ marginTop: 2 }} numberOfLines={1}>{d?.displayName ?? me?.provider?.displayName ?? ' '}</H>
        </View>
        <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={[{ width: 42, height: 42, borderRadius: 999, backgroundColor: c.n100, alignItems: 'center', justifyContent: 'center' }, shadow.sm]}>
          <Icon d={ICON.bell} size={21} stroke={2.75} />
          {!!me?.unreadNotifications && <View style={{ position: 'absolute', top: 7, right: 8, width: 9, height: 9, borderRadius: 999, backgroundColor: c.a600, borderWidth: 2, borderColor: c.n100 }} />}
        </Pressable>
      </View>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 8 }}>
          {d!.status === 'SUSPENDED' && (
            <View style={{ backgroundColor: '#fee2e2', borderRadius: radius.md, padding: 14, marginBottom: 14 }}>
              <T w="heavy" size={13.5} color="#991b1b">Your profile is suspended</T>
              <T size={12.5} color="#7f1d1d" style={{ marginTop: 3 }}>You are hidden from search and can't accept new requests. Contact support to resolve it.</T>
            </View>
          )}
          {d!.verification !== 'VERIFIED' && d!.status !== 'SUSPENDED' && (
            <Pressable onPress={() => router.push({ pathname: '/onboarding', params: { step: '4', edit: '1' } })} style={{ backgroundColor: c.a100, borderRadius: radius.md, padding: 14, marginBottom: 14 }}>
              <T w="heavy" size={13.5} color={c.a900}>{d!.verification === 'REUPLOAD' ? 'Re-upload a document' : d!.verification === 'REJECTED' ? 'Verification not approved' : 'Get the ✓ Verified badge'}</T>
              <T size={12.5} color={c.a900} style={{ marginTop: 3 }}>{d!.verification === 'PENDING' ? 'Upload your ID and address proof. Verified pros rank higher.' : 'Open documents to see what we need.'}</T>
            </Pressable>
          )}
          {d!.newRequests.count > 0 && (
            <View style={{ backgroundColor: c.a200, borderRadius: radius.lg, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: c.a700, alignItems: 'center', justifyContent: 'center' }}>
                  <T w="heavy" size={13} color="#fff">{d!.newRequests.count}</T>
                </View>
                <H size={19} style={{ color: c.a900 }}>New booking request{d!.newRequests.count > 1 ? 's' : ''}</H>
              </View>
              <T size={13} color={c.a900} style={{ opacity: 0.85, marginTop: 8, marginBottom: 12 }}>
                {d!.newRequests.soonestExpiry ? `The next one expires in ${countdown(d!.newRequests.soonestExpiry)}. ` : ''}Accepting locks the slot on your calendar.
              </T>
              <Btn label="Review requests" size="sm" onPress={() => router.push('/(provider)/requests')} style={{ alignSelf: 'flex-start', backgroundColor: c.a700, paddingHorizontal: 20 }} />
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {[
              ['This week', money(d!.stats.weekEarnings), `${d!.week.jobs} paid job${d!.week.jobs === 1 ? '' : 's'}`, c.a700],
              ['Upcoming', String(d!.stats.upcomingJobs), 'Confirmed jobs', c.text],
              ['Rating', d!.stats.ratingCount ? d!.stats.rating.toFixed(1) : 'New', `${d!.stats.ratingCount} reviews`, c.text],
              ['Acceptance', `${Math.round((d!.stats.acceptanceRate ?? 1) * 100)}%`, `${d!.stats.profileViews.toLocaleString('en-IN')} profile views`, c.text],
            ].map(([k, v, sub, color]) => (
              <View key={k} style={[{ width: '48.4%', backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }, shadow.sm]}>
                <T w="heavy" size={11} color={c.n600} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>{k}</T>
                <H size={24} style={{ marginTop: 6, color }}>{v}</H>
                <T size={11.5} color={c.n600} style={{ marginTop: 2 }}>{sub}</T>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
            <H size={20}>Today</H>
            <Pressable onPress={() => router.push('/(provider)/calendar')}><T w="bold" size={12.5} color={c.a700}>Open calendar</T></Pressable>
          </View>
          {!d!.today.length ? (
            <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 20, alignItems: 'center' }}>
              <T w="bold" size={13.5}>No jobs today</T>
              <T size={12.5} color={c.n700} style={{ marginTop: 4 }}>Open more slots to get found sooner.</T>
              <Btn label="Manage availability" variant="outline" size="sm" onPress={() => router.push('/availability')} style={{ marginTop: 12, paddingHorizontal: 18 }} />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {d!.today.map((b) => {
                const [label, tone] = STATUS_TONE[b.status] ?? [b.status, 'grey'];
                const [time, ampm] = hourLabel(b.startHour, false).split(' ');
                return (
                  <Pressable key={b.id} onPress={() => router.push(`/booking/${b.id}`)} style={[{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: c.n100, borderRadius: radius.md, padding: 13 }, shadow.sm]}>
                    <View style={{ width: 52, alignItems: 'center' }}>
                      <T w="heavy" size={14}>{time}</T>
                      <T size={10.5} color={c.n600}>{ampm}</T>
                    </View>
                    <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 999, backgroundColor: tone === 'amber' ? c.a700 : tone === 'green' ? c.g700 : c.a600 }} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="heavy" size={14} numberOfLines={1}>{b.customerName}</T>
                      <T size={12} color={c.n700}>{b.serviceName} · {b.hours} h</T>
                    </View>
                    <Pill label={label} toneKey={tone} size="sm" />
                  </Pressable>
                );
              })}
            </View>
          )}

          <H size={20} style={{ marginTop: 22, marginBottom: 10 }}>Quick actions</H>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {[
              ['View requests', '🔔', c.a200, () => router.push('/(provider)/requests')],
              ['Manage availability', '⏰', c.g200, () => router.push('/availability')],
              ['My services', '▤', c.n300, () => router.push('/services')],
              ['Open calendar', '🗓', c.a200, () => router.push('/(provider)/calendar')],
              ['Earnings', '₹', c.g200, () => router.push('/earnings')],
              ['Edit profile', '✎', c.n300, () => router.push('/business')],
            ].map(([label, glyph, tone, go]) => (
              <Pressable key={label as string} onPress={go as () => void} style={{ width: '48.6%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.n100, borderRadius: radius.md, padding: 13 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: tone as string, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={15}>{glyph as string}</T>
                </View>
                <T w="bold" size={12.5} style={{ flex: 1, lineHeight: 16 }}>{label as string}</T>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 20, backgroundColor: c.g100, borderRadius: radius.md, padding: 15 }}>
            <T w="heavy" size={13} color={c.g900}>This week</T>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 7, height: 74, marginTop: 12 }}>
              {d!.week.bars.map((b, i) => {
                const max = Math.max(1, ...d!.week.bars.map((x) => x.amount));
                return (
                  <View key={b.date} style={{ flex: 1, alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ width: '100%', borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === 6 ? c.a600 : c.g600, height: `${Math.max(6, Math.round((b.amount / max) * 100))}%` }} />
                    <T size={9.5} color={c.g900} style={{ opacity: 0.7 }}>{b.label}</T>
                  </View>
                );
              })}
            </View>
            <T size={12.5} color={c.g900} style={{ opacity: 0.85, marginTop: 10 }}>
              {money(d!.week.total)} earned over the last 7 days{d!.nextPayout ? ` · next payout ${money(d!.nextPayout.amount)}` : ''}
            </T>
          </View>
        </Scroll>
      )}
    </Screen>
  );
}
