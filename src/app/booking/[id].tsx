import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Btn, Card, Chip, ConfirmSheet, ErrorState, Field, Footer, H, Img, Kicker, Loading, Pill, Row, Screen, Scroll, Sheet, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { agoLong, countdown, dateLabel, hourLabel, money, stars, timeOfDay } from '@/lib/format';
import { useBooking } from '@/lib/queries';
import { joinBooking } from '@/lib/socket';
import { c, radius } from '@/lib/theme';
import type { Booking } from '@/lib/types';

const DECLINE_REASONS = ['Fully booked', 'Outside my area', 'Needs a specialist', 'Rate too low', 'Personal emergency'];

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: b, isLoading, error, refetch, isRefetching } = useBooking(id);
  const [sheet, setSheet] = useState<null | 'cancel' | 'decline' | 'complete' | 'delete'>(null);
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState(0);
  const provider = me?.role === 'PROVIDER';

  useEffect(() => (id ? joinBooking(id) : undefined), [id]);

  const act = useMutation({
    mutationFn: ({ path, body, method }: { path: string; body?: unknown; method?: string }) => api<Booking>(`/bookings/${id}${path}`, { body: body ?? {}, method }),
    onSuccess: (updated, vars) => {
      if (updated?.id) qc.setQueryData(['booking', id], updated);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['open-hours'] });
      setSheet(null);
      setReason('');
      const msg: Record<string, string> = {
        '/accept': 'Accepted. Slot is now locked.',
        '/decline': 'Declined. Slot released.',
        '/start': 'Job started',
        '/complete': 'Marked complete. Customer can pay now.',
        '/cancel': 'Booking cancelled. Slot released.',
      };
      if (msg[vars.path]) toast(msg[vars.path]);
      if (vars.method === 'DELETE') {
        toast('Removed from your history');
        router.back();
      }
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Something went wrong'),
  });

  if (isLoading) return <Screen><Loading /></Screen>;
  if (error || !b) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;

  const can = (a: string) => b.actions.includes(a);
  const other = provider ? b.customer : b.provider;
  const lateCancel = !provider && ['ACCEPTED', 'UPCOMING'].includes(b.status) && new Date(b.startAt).getTime() - Date.now() < 4 * 3600_000;
  const amount = provider ? b.pricing.providerPayout ?? b.pricing.serviceAmount : b.pricing.customerTotal;

  // Primary action for the footer.
  let primary: { label: string; run: () => void } | null = null;
  if (provider) {
    if (can('start')) primary = { label: 'Start service', run: () => act.mutate({ path: '/start' }) };
    else if (can('complete')) primary = { label: 'Mark complete', run: () => setSheet('complete') };
  } else {
    if (can('pay')) primary = { label: `Pay ${money(b.pricing.customerTotal, { decimals: true })}`, run: () => router.push(`/pay/${b.id}`) };
    else if (can('review')) primary = { label: `Rate ${b.provider?.person?.split(' ')[0] ?? 'your pro'}`, run: () => router.push(`/review/${b.id}`) };
  }

  const rows: [string, string][] = [
    ['Service', b.serviceName],
    ['Date', dateLabel(b.dateKey)],
    ['Time', `${hourLabel(b.startHour, false)} – ${hourLabel((b.startHour + b.hours) % 24, false)}`],
    ['Duration', b.durationLabel],
    ['Address', [b.address.line1, b.address.areaName || b.address.line2, b.address.city].filter(Boolean).join(', ') || '—'],
    ['Rate', `${money(b.pricing.rate)} ${b.pricing.unit === 'DAY' ? 'per day' : 'per hour'}`],
    ['Service amount', money(b.pricing.serviceAmount)],
  ];
  if (provider) {
    rows.push(['AAWRO commission + GST', `−${money((b.pricing.commission ?? 0) + (b.pricing.commissionGst ?? 0), { decimals: true })}`]);
  } else {
    rows.push(['Convenience fee + GST', money(b.pricing.convenienceFee + b.pricing.convenienceGst, { decimals: true })]);
    if (b.pricing.discount) rows.push(['Coupon', `−${money(b.pricing.discount)}`]);
  }

  return (
    <Screen>
      <TopBar
        title={b.code}
        subtitle={`${provider ? 'Received' : 'Booked'} ${agoLong(b.createdAt)}`}
        right={<Pill label={b.statusLabel} toneKey={b.statusTone} />}
      />
      <Scroll refreshing={isRefetching} onRefresh={refetch} contentStyle={{ paddingTop: 8 }}>
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 13 }}>
          {provider ? <Avatar name={other?.name} size={52} /> : <Img uri={b.provider?.photoUrl} radius={16} style={{ width: 52, height: 52 }} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w="heavy" size={15}>{other?.name}</T>
            <T size={12.5} color={c.n600}>
              {provider ? `${b.address.areaName ?? b.address.city ?? ''}${b.customer?.phone ? ` · ${b.customer.phone}` : ''}` : `${b.provider?.person} · ★ ${b.provider?.rating?.toFixed(1)}`}
            </T>
          </View>
          {!provider && b.provider && (
            <Pressable onPress={() => router.push(`/provider/${b.provider!.id}`)}>
              <T w="bold" size={12.5} color={c.a700}>Profile</T>
            </Pressable>
          )}
        </Card>

        {b.status === 'REQUESTED' && b.expiresAt && (
          <View style={{ marginTop: 14, backgroundColor: c.a100, borderRadius: radius.md, padding: 15 }}>
            <T w="heavy" size={14} color={c.a900}>{provider ? `Respond within ${countdown(b.expiresAt)}` : `Waiting for response · expires in ${countdown(b.expiresAt)}`}</T>
            <T size={13} color={c.a900} style={{ marginTop: 4, lineHeight: 19 }}>
              {provider ? 'Accepting locks these hours on your calendar. Overlapping requests are declined automatically.' : 'The slot stays open to others until the provider accepts. You pay only after the job.'}
            </T>
          </View>
        )}
        {b.status === 'DECLINED' && (
          <View style={{ marginTop: 14, backgroundColor: c.n200, borderRadius: radius.md, padding: 15 }}>
            <T w="heavy" size={14} style={{ marginBottom: 5 }}>Request declined</T>
            <T size={13} color={c.n800} style={{ lineHeight: 19 }}>{b.reason ? `${b.reason}. ` : ''}The slot has been released, so you can book another provider or another time.</T>
            {!provider && <Btn label="Find another pro" size="sm" onPress={() => router.push(`/providers/${b.categoryId}`)} style={{ alignSelf: 'flex-start', marginTop: 12 }} />}
          </View>
        )}
        {b.status === 'EXPIRED' && (
          <View style={{ marginTop: 14, backgroundColor: c.n200, borderRadius: radius.md, padding: 15 }}>
            <T w="heavy" size={14} style={{ marginBottom: 5 }}>No response in time</T>
            <T size={13} color={c.n800}>The request expired without an answer. Nothing was charged.</T>
            {!provider && <Btn label="See other providers" size="sm" onPress={() => router.push(`/providers/${b.categoryId}`)} style={{ alignSelf: 'flex-start', marginTop: 12 }} />}
          </View>
        )}
        {b.status === 'CANCELLED' && (
          <View style={{ marginTop: 14, backgroundColor: c.n200, borderRadius: radius.md, padding: 15 }}>
            <T size={13} style={{ lineHeight: 19 }}>
              Cancelled by {b.cancelledBy === 'ADMIN' ? 'AAWRO' : b.cancelledBy === 'PROVIDER' ? (provider ? 'you' : 'the provider') : provider ? 'the customer' : 'you'}
              {b.reason ? ` · ${b.reason}` : ''}. The slot was released back to the provider's calendar.
              {b.cancelFee ? ` A late cancellation fee of ${money(b.cancelFee)} applies.` : ''}
            </T>
          </View>
        )}
        {b.status === 'DISPUTED' && (
          <View style={{ marginTop: 14, backgroundColor: '#fee2e2', borderRadius: radius.md, padding: 15 }}>
            <T w="heavy" size={14} color="#991b1b">Under review</T>
            <T size={13} color="#7f1d1d" style={{ marginTop: 4 }}>{b.reason ?? 'A problem was reported.'} AAWRO support will reply in the ticket{provider ? ' — your payout is on hold until then.' : '.'}</T>
          </View>
        )}

        {!['DECLINED', 'EXPIRED', 'CANCELLED'].includes(b.status) && (
          <>
            <Kicker>Progress</Kicker>
            <View style={{ backgroundColor: c.n100, borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 15 }}>
              {b.timeline.map((t, i) => {
                const current = !t.done && (i === 0 || b.timeline[i - 1].done);
                const last = i === b.timeline.length - 1;
                return (
                  <View key={t.key} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center', width: 18 }}>
                      <View style={{ width: 15, height: 15, borderRadius: 999, backgroundColor: t.done ? c.g600 : c.n100, borderWidth: 2.5, borderColor: t.done ? c.g600 : current ? c.accent : c.n300 }} />
                      {!last && <View style={{ width: 2.5, flex: 1, minHeight: 26, backgroundColor: t.done ? c.g600 : c.n300 }} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
                      <T w={t.done || current ? 'bold' : 'medium'} size={13.5} color={t.done || current ? c.text : c.n600}>
                        {t.key === 'PAID' && provider ? 'Payment received' : t.label}
                      </T>
                      {!!t.at && <T size={11.5} color={c.n600} style={{ marginTop: 2 }}>{dateLabel(new Date(new Date(t.at).getTime() + 330 * 60_000).toISOString().slice(0, 10))}, {timeOfDay(t.at)}</T>}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Kicker>{provider ? 'Job' : 'Details'}</Kicker>
        <View style={{ backgroundColor: c.n100, borderRadius: radius.md, paddingVertical: 4, paddingHorizontal: 15 }}>
          {rows.map(([k, v]) => (
            <Row key={k} k={k} v={v} />
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, paddingBottom: 15 }}>
            <T w="bold" size={13.5}>{provider ? 'You earn' : b.paidAt ? 'Total paid' : b.status === 'COMPLETED' ? 'Total payable' : 'Estimated total'}</T>
            <H size={23} style={{ color: c.a700 }}>{money(amount, { decimals: true })}</H>
          </View>
        </View>

        {!!b.note && (
          <>
            <Kicker>{provider ? 'Customer note' : 'Job note'}</Kicker>
            <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
              <T size={13} style={{ lineHeight: 19 }}>{b.note}</T>
            </View>
          </>
        )}

        {!!b.review && (
          <>
            <Kicker>{provider ? 'Customer review' : 'Your review'}</Kicker>
            <View style={{ backgroundColor: c.g100, borderRadius: radius.md, padding: 14 }}>
              <T w="heavy" size={14}>{stars(b.review.rating)}</T>
              {!!b.review.text && <T size={13} style={{ marginTop: 6, lineHeight: 19 }}>{b.review.text}</T>}
            </View>
          </>
        )}

        {!provider && can('dispute') && (
          <Pressable onPress={() => router.push(`/report/${b.id}`)} style={{ marginTop: 18, alignItems: 'center', padding: 8 }}>
            <T w="bold" size={13} color={c.n700}>Report a problem</T>
          </Pressable>
        )}
      </Scroll>

      {(can('chat') || primary || can('accept') || can('cancel') || can('delete')) && (
        <Footer>
          {can('accept') ? (
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <Btn label="Decline" variant="outline" onPress={() => setSheet('decline')} style={{ flex: 1 }} />
              <Btn label="Accept request" variant="green" onPress={() => act.mutate({ path: '/accept', body: { version: b.version } })} loading={act.isPending && act.variables?.path === '/accept'} style={{ flex: 1 }} />
            </View>
          ) : (
            (can('chat') || primary) && (
              <View style={{ flexDirection: 'row', gap: 9 }}>
                {can('chat') && <Btn label="Open chat" variant="outline" onPress={() => router.push(`/chat/${b.id}`)} style={{ flex: 1 }} />}
                {primary && <Btn label={primary.label} onPress={primary.run} loading={act.isPending} style={{ flex: 1 }} />}
              </View>
            )
          )}
          {can('accept') && can('chat') && <Btn label="Message the customer" variant="ghost" size="sm" onPress={() => router.push(`/chat/${b.id}`)} />}
          {can('cancel') && (
            <Pressable onPress={() => setSheet('cancel')} style={{ alignItems: 'center', padding: 6 }}>
              <T w="bold" size={13} color={c.a700}>{b.status === 'REQUESTED' ? 'Cancel request' : 'Cancel booking'}</T>
            </Pressable>
          )}
          {can('delete') && (
            <Pressable onPress={() => setSheet('delete')} style={{ alignItems: 'center', padding: 6 }}>
              <T w="bold" size={13} color={c.n600}>Delete from history</T>
            </Pressable>
          )}
        </Footer>
      )}

      <ConfirmSheet
        visible={sheet === 'cancel'}
        title="Cancel this booking?"
        body={
          provider
            ? 'The customer is told straight away and the hours go back on your calendar. Cancelling confirmed jobs counts against your record.'
            : lateCancel
              ? `It starts in under 4 hours, so a fee of ${money(Math.round(b.pricing.serviceAmount * 0.2))} (20% of the service amount) is added to your next payment.`
              : 'This is free — the provider is notified and the slot is released.'
        }
        confirm="Yes, cancel booking"
        onConfirm={() => {
          if (provider && reason.trim().length < 3) return toast('Tell the customer why you are cancelling');
          act.mutate({ path: '/cancel', body: { reason: reason.trim() || undefined } });
        }}
        onClose={() => setSheet(null)}
        loading={act.isPending}
      >
        <Field value={reason} onChangeText={setReason} placeholder={provider ? 'Reason (required)' : 'Reason (optional)'} style={{ marginBottom: 14 }} />
      </ConfirmSheet>

      <Sheet visible={sheet === 'decline'} onClose={() => setSheet(null)}>
        <H size={23} style={{ marginBottom: 8 }}>Decline this request?</H>
        <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>The slot is released immediately and the customer is notified.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {DECLINE_REASONS.map((r) => (
            <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
          ))}
        </View>
        <Btn label="Decline request" style={{ backgroundColor: c.a700 }} loading={act.isPending} onPress={() => act.mutate({ path: '/decline', body: { reason: reason || undefined } })} />
        <Btn label="Keep it open" variant="ghost" textStyle={{ color: c.text }} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet visible={sheet === 'complete'} onClose={() => setSheet(null)}>
        <H size={23} style={{ marginBottom: 8 }}>Mark the job complete?</H>
        <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>
          The customer is asked to pay right away.{b.pricing.unit === 'HOUR' ? ' Worked longer? Add the extra hours at the same rate.' : ''}
        </T>
        {b.pricing.unit === 'HOUR' && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {[0, 1, 2, 3, 4].map((h) => (
              <Chip key={h} label={h ? `+${h}h` : 'On time'} active={extra === h} onPress={() => setExtra(h)} />
            ))}
          </View>
        )}
        <Btn label={`Mark complete${extra ? ` · ${money(b.pricing.rate * (b.hours + extra))}` : ''}`} loading={act.isPending} onPress={() => act.mutate({ path: '/complete', body: { extraHours: extra } })} />
        <Btn label="Not yet" variant="ghost" textStyle={{ color: c.text }} onPress={() => setSheet(null)} />
      </Sheet>

      <ConfirmSheet
        visible={sheet === 'delete'}
        title="Delete this record?"
        body={`${b.code} disappears from your history. The provider keeps their own copy for their records.`}
        confirm="Delete permanently"
        danger="dark"
        onConfirm={() => act.mutate({ path: '', method: 'DELETE' })}
        onClose={() => setSheet(null)}
        loading={act.isPending}
      />
    </Screen>
  );
}
