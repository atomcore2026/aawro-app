import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar, Btn, Chip, ErrorState, Field, Footer, H, Kicker, Loading, Screen, Scroll, Sheet, T, TopBar } from '@/components/ui';
import { api } from '@/lib/api';
import { addDays, dayParts, DURATION_HOURS, DURATION_LABEL, estimate, hourLabel, money, rateLabel, todayKey } from '@/lib/format';
import { watchProvider } from '@/lib/socket';
import { c, radius } from '@/lib/theme';
import type { Service } from '@/lib/types';
import { useProviderProfile } from '@/lib/queries';

interface Day {
  date: string;
  weekday: string;
  open: number[];
  booked: number[];
  closed: boolean;
}

/** "Choose a slot": date strip, open start times, duration and a note. */
export default function ChooseSlot() {
  const { providerId, serviceId } = useLocalSearchParams<{ providerId: string; serviceId?: string }>();
  const { data: p, isLoading, error, refetch } = useProviderProfile(providerId);
  const hours = useQuery({
    queryKey: ['open-hours', providerId],
    queryFn: () => api<{ from: string; days: Day[] }>(`/providers/${providerId}/open-hours?days=14`),
    enabled: !!providerId,
  });
  useEffect(() => (providerId ? watchProvider(providerId) : undefined), [providerId]);

  const [svcId, setSvcId] = useState(serviceId || '');
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState<string>('1');
  const [note, setNote] = useState('');
  const [pickService, setPickService] = useState(false);

  const service: Service | undefined = p?.services.find((s) => s.id === svcId) ?? p?.services[0];
  useEffect(() => {
    if (service && service.unit === 'DAY' && !['HALF', 'FULL'].includes(duration)) setDuration('FULL');
  }, [service, duration]);

  const days = hours.data?.days ?? [];
  useEffect(() => {
    if (!date && days.length) setDate(days.find((d) => d.open.length)?.date ?? days[0].date);
  }, [days, date]);
  const day = days.find((d) => d.date === date);

  // A start hour is offered only if the chosen duration fits in consecutive open hours.
  const need = DURATION_HOURS[duration];
  const fits = (h: number) => {
    const open = new Set(day?.open ?? []);
    for (let i = h; i < h + need; i++) if (!open.has(i)) return false;
    return true;
  };
  const starts = (day?.open ?? []).filter(fits);
  useEffect(() => {
    if (start !== null && !starts.includes(start)) setStart(null);
  }, [starts, start]);

  const durOptions = service?.unit === 'DAY' ? ['HALF', 'FULL'] : ['1', '2', '3', 'HALF', 'FULL'];
  const amount = service ? estimate(service.rate, service.unit, duration) : 0;
  const ready = !!service && !!date && start !== null;

  const next = () => {
    if (!ready) return;
    router.push({ pathname: '/book/summary', params: { providerId, serviceId: service!.id, date: date!, startHour: String(start), duration, note } });
  };

  const dayChips = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const key = addDays(hours.data?.from ?? todayKey(), i);
        return { key, d: days.find((x) => x.date === key) };
      }),
    [hours.data, days],
  );

  if (isLoading || hours.isLoading) return <Screen><Loading /></Screen>;
  if (error || !p) return <Screen><ErrorState error={error ?? hours.error} onRetry={() => { refetch(); hours.refetch(); }} /></Screen>;

  return (
    <Screen>
      <TopBar title="Choose a slot" subtitle={p.name} />
      <Scroll contentStyle={{ paddingTop: 8 }} refreshing={hours.isRefetching} onRefresh={hours.refetch}>
        <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 13, flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 18 }}>
          <Avatar name={p.person || p.name} size={46} rounded={false} bg={c.a300} fg={c.a900} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w="bold" size={14} numberOfLines={1}>{service?.name ?? 'Pick a service'}</T>
            {service && <T size={12} color={c.n600}>{money(service.rate)} {service.unit === 'DAY' ? 'per day' : 'per hour'}</T>}
          </View>
          {p.services.length > 1 && (
            <Pressable onPress={() => setPickService(true)} hitSlop={8}>
              <T w="bold" size={12.5} color={c.a700}>Change</T>
            </Pressable>
          )}
        </View>

        <Kicker style={{ marginTop: 0 }}>Select date</Kicker>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {dayChips.map(({ key, d }) => {
            const parts = dayParts(key);
            const on = key === date;
            const closed = !d || d.closed || !d.open.length;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setDate(key);
                  setStart(null);
                }}
                style={{ width: 58, borderRadius: 18, paddingVertical: 11, alignItems: 'center', backgroundColor: on ? c.accent : c.n100, borderWidth: 1.5, borderColor: on ? c.accent : c.n300, opacity: closed && !on ? 0.45 : 1 }}
              >
                <T w="bold" size={10.5} color={on ? '#fff' : c.text} style={{ textTransform: 'uppercase' }}>{parts.dow}</T>
                <T w="heavy" size={19} color={on ? '#fff' : c.text} style={{ marginVertical: 2 }}>{parts.dd}</T>
                <T size={9.5} color={on ? '#fff' : c.n700}>{parts.mon}</T>
              </Pressable>
            );
          })}
        </ScrollView>

        {day && day.closed ? (
          <View style={{ marginTop: 16, backgroundColor: c.n200, borderRadius: radius.md, padding: 16 }}>
            <T size={13.5} color={c.n800}>{p.person} does not work on this day. Greyed dates are outside {p.availability.daysLabel}.</T>
          </View>
        ) : (
          <>
            <Kicker right={<T size={11.5} color={c.n600}>{starts.length} open</T>}>Available slots</Kicker>
            {starts.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {starts.map((h) => {
                  const on = start === h;
                  return (
                    <Pressable key={h} onPress={() => setStart(h)} style={{ width: '31.3%', borderRadius: 14, paddingVertical: 13, alignItems: 'center', backgroundColor: on ? c.accent : c.n100, borderWidth: 1.5, borderColor: on ? c.accent : c.n300 }}>
                      <T w="bold" size={13.5} color={on ? '#fff' : c.text}>{hourLabel(h)}</T>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ backgroundColor: c.n200, borderRadius: radius.md, padding: 16 }}>
                <T size={13.5}>{day?.open.length ? `No ${DURATION_LABEL[duration].toLowerCase()} block is free on this date. Try a shorter duration or another date.` : 'Every slot on this date is already locked by a confirmed booking. Try another date.'}</T>
              </View>
            )}
            <T size={11.5} color={c.n600} style={{ marginTop: 12 }}>Locked slots are hidden — a confirmed booking blocks that hour for everyone.</T>

            <Kicker style={{ marginTop: 24 }}>Duration</Kicker>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {durOptions.map((d) => (
                <Chip key={d} label={DURATION_LABEL[d]} active={duration === d} color="green" onPress={() => setDuration(d)} style={{ paddingHorizontal: 17, paddingVertical: 11 }} />
              ))}
            </View>

            <Kicker style={{ marginTop: 24 }}>Note for the provider</Kicker>
            <Field value={note} onChangeText={setNote} multiline placeholder="What needs doing? Any access details?" maxLength={1000} />
          </>
        )}
      </Scroll>
      <Footer style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View>
          <T size={11} color={c.n600}>Estimated</T>
          <T w="heavy" size={17} color={c.a700}>{money(amount)}</T>
        </View>
        <Btn label={ready ? 'Review booking' : 'Pick a date and time'} disabled={!ready} onPress={next} style={{ flex: 1 }} />
      </Footer>

      <Sheet visible={pickService} onClose={() => setPickService(false)}>
        <H size={22} style={{ marginBottom: 12 }}>Pick a service</H>
        <View style={{ gap: 8 }}>
          {p.services.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSvcId(s.id);
                setPickService(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.n100, borderRadius: radius.md, padding: 13, borderWidth: 1.5, borderColor: s.id === service?.id ? c.accent : c.n100 }}
            >
              <T w="bold" size={14} style={{ flex: 1 }}>{s.name}</T>
              <T w="heavy" size={14} color={c.a700}>{rateLabel(s.rate, s.unit)}</T>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

