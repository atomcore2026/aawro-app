import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { HourGrid } from '@/components/HourGrid';
import { Btn, Chip, ErrorState, Footer, Kicker, Loading, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { addDays, dateLabel, todayKey } from '@/lib/format';
import { WEEK } from '@/lib/provider';
import { c, radius } from '@/lib/theme';

interface Availability {
  weekly: Record<string, number[]>;
  summary: { daysLabel: string; hoursLabel: string };
  locked: Record<string, number[]>;
  overrides: { date: string; hours: number[]; reason?: string }[];
}

/** Manage availability: working days, hours, and days off. */
export default function AvailabilityScreen() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['availability'], queryFn: () => api<Availability>('/provider/availability') });
  const [mode, setMode] = useState<'same' | 'each'>('same');
  const [day, setDay] = useState('mon');
  const [weekly, setWeekly] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWeekly(data.weekly);
    const lists = WEEK.map(([d]) => JSON.stringify(data.weekly[d] ?? [])).filter((x) => x !== '[]');
    if (new Set(lists).size > 1) setMode('each');
  }, [data]);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (error || !data) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;

  const working = WEEK.map(([d]) => d).filter((d) => (weekly[d] ?? []).length);
  const template = weekly[working[0]] ?? [9, 10, 11, 12, 13, 14, 15, 16];
  const shownHours = mode === 'same' ? template : weekly[day] ?? [];
  const lockedFor = (d: string) => data.locked[d] ?? [];
  const shownLocked = mode === 'same' ? [...new Set(working.flatMap(lockedFor))] : lockedFor(day);

  const toggleDay = (d: string) =>
    setWeekly((w) => {
      const on = (w[d] ?? []).length > 0;
      if (on && lockedFor(d).length) {
        toast('This day has a booking this week — its booked hours stay open');
        return { ...w, [d]: lockedFor(d) };
      }
      return { ...w, [d]: on ? [] : template };
    });

  const setHours = (fn: (h: number[]) => number[]) =>
    setWeekly((w) => {
      if (mode === 'each') return { ...w, [day]: fn(w[day] ?? []) };
      const next = fn(template);
      return Object.fromEntries(WEEK.map(([d]) => [d, (w[d] ?? []).length ? next : []]));
    });

  const toggleHour = (h: number) => setHours((list) => (list.includes(h) ? list.filter((x) => x !== h) : [...list, h].sort((a, b) => a - b)));

  const save = async () => {
    setBusy(true);
    try {
      const r = await api<Availability & { warnings: string[] }>('/provider/availability', { method: 'PUT', body: { weekly } });
      qc.setQueryData(['availability'], r);
      qc.invalidateQueries({ queryKey: ['provider-me'] });
      toast(r.warnings?.length ? 'Saved. Booked hours were kept open.' : 'Availability saved. Customers see it now.');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const toggleOff = async (date: string) => {
    const existing = data.overrides.find((o) => o.date === date);
    try {
      if (existing) await api(`/provider/availability/overrides/${date}`, { method: 'DELETE' });
      else await api(`/provider/availability/overrides/${date}`, { method: 'PUT', body: { hours: [], reason: 'Day off' } });
      await refetch();
      qc.invalidateQueries({ queryKey: ['open-hours'] });
      toast(existing ? 'Day reopened' : `${dateLabel(date)} blocked`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not update');
    }
  };

  const dirty = JSON.stringify(weekly) !== JSON.stringify(data.weekly);
  return (
    <Screen>
      <TopBar title="Manage availability" subtitle="You own your calendar" />
      <Scroll contentStyle={{ paddingTop: 10 }}>
        <Kicker style={{ marginTop: 0 }}>Working days</Kicker>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {WEEK.map(([d, label]) => {
            const on = working.includes(d);
            return (
              <Pressable key={d} onPress={() => toggleDay(d)} style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: on ? c.accent : c.n100, borderWidth: 1.5, borderColor: on ? c.accent : c.n300 }}>
                <T w="heavy" size={12} color={on ? '#fff' : c.n800}>{label}</T>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Chip label="Same hours every day" active={mode === 'same'} onPress={() => setMode('same')} />
          <Chip label="Different per day" active={mode === 'each'} onPress={() => setMode('each')} />
        </View>
        {mode === 'each' && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {WEEK.map(([d, label]) => (
              <Chip key={d} label={label} active={day === d} onPress={() => setDay(d)} style={{ paddingHorizontal: 10 }} />
            ))}
          </View>
        )}
        <Kicker
          style={{ marginTop: 24 }}
          right={
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={() => setHours(() => [9, 10, 11, 12, 13, 14, 15, 16])}><T w="heavy" size={12.5} color={c.a700}>9 to 5</T></Pressable>
              <Pressable onPress={() => setHours(() => [])}><T w="heavy" size={12.5} color={c.n700}>Clear</T></Pressable>
            </View>
          }
        >
          {mode === 'each' ? `Hours on ${WEEK.find((w) => w[0] === day)![1]}` : 'Your hours'}
        </Kicker>
        <T size={12} color={c.n600} style={{ marginBottom: 12 }}>Tap an hour to open or close it. Booked hours stay locked.</T>
        <HourGrid open={shownHours} locked={shownLocked} onToggle={toggleHour} />
        <T size={12} color={c.n600} style={{ marginTop: 12 }}>{shownHours.length} hours a day · {working.length} days a week</T>

        <Kicker style={{ marginTop: 26 }}>Days off (next 2 weeks)</Kicker>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 14 }, (_, i) => addDays(todayKey(), i)).map((d) => {
            const off = data.overrides.some((o) => o.date === d && !o.hours.length);
            return (
              <Pressable key={d} onPress={() => toggleOff(d)} style={{ borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: off ? c.n800 : c.n100, borderWidth: 1, borderColor: off ? c.n800 : c.n300 }}>
                <T w="bold" size={11.5} color={off ? '#fff' : c.n800}>{dateLabel(d).replace('Today, ', 'Today ').replace('Tomorrow, ', 'Tmrw ')}</T>
              </Pressable>
            );
          })}
        </View>
        <T size={11.5} color={c.n600} style={{ marginTop: 8 }}>Tap a date to block it (holiday, personal day). Dark dates are blocked.</T>
      </Scroll>
      <Footer>
        <Btn label={dirty ? 'Save availability' : 'Saved'} size="lg" disabled={!dirty} loading={busy} onPress={save} />
      </Footer>
    </Screen>
  );
}
