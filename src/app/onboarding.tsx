import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { HourGrid } from '@/components/HourGrid';
import { Avatar, BackButton, Btn, Field, Footer, H, Img, Kicker, Loading, Row, Screen, Scroll, Stepper, T, Tag, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money, rateLabel, unitLabel } from '@/lib/format';
import { pickAndUpload } from '@/lib/pickImage';
import { ProviderMe, rateBounds, rateStep, useProviderMe, WEEK } from '@/lib/provider';
import { c, radius, shadow } from '@/lib/theme';
import type { Group, Unit } from '@/lib/types';

const TITLES = ['Your profile', 'Categories', 'Services and rates', 'Availability', 'Portfolio and documents', 'Preview', 'Publish'];

interface Draft {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  unit: Unit;
  rate: number;
  published: boolean;
  dirty?: boolean;
}

/** Provider setup in 7 steps. Also reused to edit one step (?step=5&edit=1). */
export default function Onboarding() {
  const params = useLocalSearchParams<{ step?: string; edit?: string }>();
  const editing = params.edit === '1';
  const toast = useToast();
  const qc = useQueryClient();
  const { refreshMe, signOut } = useAuth();
  const { data: p, isLoading } = useProviderMe();
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => api<Group[]>('/catalog/groups') });
  const [step, setStep] = useState(Number(params.step) || 0);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [person, setPerson] = useState('');
  const [business, setBusiness] = useState('');
  const [area, setArea] = useState('');
  const [about, setAbout] = useState('');
  const [years, setYears] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  // Step 2
  const [cats, setCats] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState('');
  // Step 3
  const [drafts, setDrafts] = useState<Draft[]>([]);
  // Step 4
  const [days, setDays] = useState<string[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  // Step 5
  const [upi, setUpi] = useState('');

  useEffect(() => {
    if (!p) return;
    setPerson(p.personName);
    setBusiness(p.displayName);
    setArea(p.areaName);
    setAbout(p.about);
    setYears(p.yearsExperience ? String(p.yearsExperience) : '');
    setPhoto(p.photoUrl);
    setCats(p.categories.map((x) => x.id));
    const working = Object.entries(p.availability ?? {}).filter(([, h]) => h.length).map(([d]) => d);
    setDays(working.length ? working : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    const anyDay = working[0] ? p.availability[working[0]] : [];
    setHours(anyDay.length ? anyDay : [9, 10, 11, 12, 13, 14, 15, 16]);
    setUpi(p.bank?.upiId ?? '');
    if (!params.step && !editing && p.onboardingStep > 1 && p.status === 'DRAFT') setStep(Math.min(6, p.onboardingStep - 1));
  }, [p?.id]);

  const allCats = useMemo(() => (groups.data ?? []).flatMap((g) => g.categories.map((x) => ({ ...x, group: g.name }))), [groups.data]);
  const catById = useMemo(() => new Map(allCats.map((x) => [x.id, x])), [allCats]);

  // Build service drafts whenever categories change (keep existing services).
  useEffect(() => {
    if (!p || !allCats.length) return;
    setDrafts((prev) => {
      const existing: Draft[] = p.services.filter((s) => cats.includes(s.categoryId)).map((s) => prev.find((d) => d.id === s.id) ?? { ...s, description: s.description ?? '' });
      const fresh = cats
        .filter((cid) => !existing.some((d) => d.categoryId === cid))
        .map((cid) => prev.find((d) => !d.id && d.categoryId === cid) ?? newDraft(catById.get(cid)!))
        .filter(Boolean) as Draft[];
      return [...existing, ...fresh];
    });
  }, [cats, p, allCats.length, catById]);

  const reload = async () => {
    const fresh = await api<ProviderMe>('/provider/me');
    qc.setQueryData(['provider-me'], fresh);
    return fresh;
  };

  const next = async () => {
    setBusy(true);
    try {
      if (step === 0) {
        if (!business.trim() || !person.trim() || !area.trim()) throw new Error('Add your name, business name and service area');
        await api('/provider/me', { method: 'PATCH', body: { personName: person.trim(), displayName: business.trim(), areaName: area.trim(), about: about.trim(), yearsExperience: Number(years) || 0, photoUrl: photo ?? undefined, onboardingStep: Math.max(2, p?.onboardingStep ?? 1) } });
      }
      if (step === 1) {
        if (!cats.length) throw new Error('Pick at least one category');
        await api('/provider/categories', { method: 'PUT', body: { categoryIds: cats } });
        await api('/provider/me', { method: 'PATCH', body: { onboardingStep: Math.max(3, p?.onboardingStep ?? 1) } });
      }
      if (step === 2) {
        if (!drafts.some((d) => d.published)) throw new Error('Publish at least one service');
        for (const d of drafts) {
          if (!d.id) await api('/provider/services', { body: { categoryId: d.categoryId, name: d.name, description: d.description, unit: d.unit, rate: d.rate, published: d.published } });
          else if (d.dirty) await api(`/provider/services/${d.id}`, { method: 'PATCH', body: { rate: d.rate, published: d.published } });
        }
        await api('/provider/me', { method: 'PATCH', body: { onboardingStep: Math.max(4, p?.onboardingStep ?? 1) } });
      }
      if (step === 3) {
        if (!days.length || !hours.length) throw new Error('Open at least one day and one hour');
        const weekly = Object.fromEntries(WEEK.map(([d]) => [d, days.includes(d) ? hours : []]));
        await api('/provider/availability', { method: 'PUT', body: { weekly } });
        await api('/provider/me', { method: 'PATCH', body: { onboardingStep: Math.max(5, p?.onboardingStep ?? 1) } });
      }
      if (step === 4) {
        if (upi.trim() && upi.trim() !== p?.bank?.upiId) await api('/provider/bank-account', { method: 'PUT', body: { type: 'UPI', upiId: upi.trim(), holderName: person } });
        await api('/provider/me', { method: 'PATCH', body: { onboardingStep: Math.max(6, p?.onboardingStep ?? 1) } });
      }
      if (step === 6) {
        await api('/provider/publish', { body: {} });
        await reload();
        await refreshMe();
        toast('Your profile is live');
        router.replace('/(provider)/dashboard');
        return;
      }
      await reload();
      if (editing) {
        toast('Saved');
        router.back();
        return;
      }
      setStep((s) => s + 1);
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    if (step === 0 || editing) {
      if (router.canGoBack()) router.back();
      else signOut().then(() => router.replace('/entry'));
    } else setStep((s) => s - 1);
  };

  if (isLoading || !p) return <Screen><Loading /></Screen>;

  const live = drafts.filter((d) => d.published);
  const term = catQuery.trim().toLowerCase();
  const pickList = (term ? allCats.filter((x) => x.name.toLowerCase().includes(term) || x.group!.toLowerCase().includes(term)) : allCats).slice(0, term ? 60 : 40);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={back} />
        <View style={{ flex: 1 }}>
          <T w="heavy" size={16}>{TITLES[step]}</T>
          <T size={12} color={c.n600}>{editing ? 'Edit' : `Step ${step + 1} of 7`}</T>
        </View>
      </View>
      {!editing && (
        <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 }}>
          {TITLES.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 999, backgroundColor: i <= step ? c.g500 : c.n300 }} />
          ))}
        </View>
      )}
      <Scroll contentStyle={{ paddingTop: 8 }}>
        {step === 0 && (
          <>
            <T size={13.5} color={c.n700} style={{ marginBottom: 16 }}>Customers see this on your profile card.</T>
            <Field label="Your name" value={person} onChangeText={setPerson} autoComplete="name" />
            <View style={{ height: 12 }} />
            <Field label="Business name" value={business} onChangeText={setBusiness} placeholder="e.g. Raj Plumbing Services" />
            <View style={{ height: 12 }} />
            <Field label="Service area" value={area} onChangeText={setArea} placeholder="e.g. Lajpat Nagar, South Delhi" />
            <View style={{ height: 12 }} />
            <Field label="Years of experience" value={years} onChangeText={setYears} keyboardType="number-pad" maxLength={2} />
            <View style={{ height: 12 }} />
            <Field label="About your work" value={about} onChangeText={setAbout} multiline maxLength={1000} placeholder="What you do, where, and what makes you good at it." />
            <Pressable
              onPress={async () => {
                try {
                  const url = await pickAndUpload({ aspect: [1, 1] });
                  if (url) setPhoto(url);
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
              style={{ marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: c.n100, borderRadius: radius.md, padding: 13 }}
            >
              <Avatar uri={photo} name={person} size={62} />
              <View style={{ flex: 1 }}>
                <T w="bold" size={13.5} color={c.a700}>{photo ? 'Change photo' : 'Add a profile photo'}</T>
                <T size={12.5} color={c.n700} style={{ lineHeight: 18 }}>Drop a clear photo of you or your team. Profiles with photos get booked twice as often.</T>
              </View>
            </Pressable>
          </>
        )}

        {step === 1 && (
          <>
            <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>Pick up to {p.limits.maxCategories} categories from the master list. These decide where customers find you.</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
              {cats.map((id) => (
                <Pressable key={id} onPress={() => setCats((s) => s.filter((x) => x !== id))} style={{ borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: c.accent }}>
                  <T w="bold" size={12.5} color={c.a100}>{catById.get(id)?.name ?? id} ✕</T>
                </Pressable>
              ))}
              {cats.length >= p.limits.maxCategories && (
                <View style={{ borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: c.n200 }}>
                  <T w="bold" size={12} color={c.n700}>{p.limits.maxCategories} of {p.limits.maxCategories} used</T>
                </View>
              )}
            </View>
            <Field value={catQuery} onChangeText={setCatQuery} placeholder="Search 300 categories" />
            <View style={{ marginTop: 12 }}>
              {pickList.map((x) => {
                const on = cats.includes(x.id);
                const full = !on && cats.length >= p.limits.maxCategories;
                return (
                  <Pressable
                    key={x.id}
                    disabled={full}
                    onPress={() => setCats((s) => (on ? s.filter((y) => y !== x.id) : [...s, x.id]))}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.divider, opacity: full ? 0.4 : 1 }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="semibold" size={14}>{x.name}</T>
                      <T size={11} color={c.n600}>{x.group}</T>
                    </View>
                    <T size={15} color={on ? c.g600 : c.n400}>{on ? '✓' : '+'}</T>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>Each category you picked is listed here. You set your own rates. No bidding, no negotiation.</T>
            <View style={{ gap: 10 }}>
              {drafts.map((d, i) => {
                const cat = p.categories.find((x) => x.id === d.categoryId) ?? catById.get(d.categoryId);
                const { min, max } = rateBounds(cat as any, d.unit);
                const set = (patch: Partial<Draft>) => setDrafts((s) => s.map((x, j) => (j === i ? { ...x, ...patch, dirty: true } : x)));
                return (
                  <View key={d.id ?? d.categoryId + i} style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        {d.id ? <T w="bold" size={14.5}>{d.name}</T> : <Field value={d.name} onChangeText={(t) => set({ name: t })} placeholder="Service name" />}
                        <T size={11.5} color={c.n600} style={{ marginTop: d.id ? 0 : 4 }}>{cat?.name}</T>
                      </View>
                      <Pressable onPress={() => set({ published: !d.published })} style={{ borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: d.published ? c.g200 : c.n200 }}>
                        <T w="heavy" size={10.5} color={d.published ? c.g900 : c.n700}>{d.published ? 'LIVE' : 'HIDDEN'}</T>
                      </Pressable>
                    </View>
                    <View style={{ marginTop: 12 }}>
                      <Stepper value={money(d.rate)} sub={unitLabel(d.unit)} onDown={() => set({ rate: Math.max(min, d.rate - rateStep(d.unit)) })} onUp={() => set({ rate: Math.min(max, d.rate + rateStep(d.unit)) })} />
                    </View>
                    <T size={11} color={c.n600} style={{ textAlign: 'center', marginTop: 6 }}>Allowed {money(min)} – {money(max)}</T>
                  </View>
                );
              })}
            </View>
            <T size={12} color={c.n600} style={{ marginTop: 12 }}>You can add up to {p.limits.maxServicesPerCategory} services per category later from My services.</T>
          </>
        )}

        {step === 3 && (
          <>
            <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>Customers can only request the slots you open here.</T>
            <Kicker style={{ marginTop: 0 }}>Working days</Kicker>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {WEEK.map(([d, label]) => {
                const on = days.includes(d);
                return (
                  <Pressable key={d} onPress={() => setDays((s) => (on ? s.filter((x) => x !== d) : [...s, d]))} style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: on ? c.accent : c.n100, borderWidth: 1.5, borderColor: on ? c.accent : c.n300 }}>
                    <T w="heavy" size={12} color={on ? '#fff' : c.n800}>{label}</T>
                  </Pressable>
                );
              })}
            </View>
            <Kicker
              style={{ marginTop: 24 }}
              right={
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <Pressable onPress={() => setHours([9, 10, 11, 12, 13, 14, 15, 16])}><T w="heavy" size={12.5} color={c.a700}>9 to 5</T></Pressable>
                  <Pressable onPress={() => setHours([])}><T w="heavy" size={12.5} color={c.n700}>Clear</T></Pressable>
                </View>
              }
            >
              Your hours
            </Kicker>
            <T size={12} color={c.n600} style={{ marginBottom: 12 }}>Tap an hour to open or close it. Booked hours stay locked.</T>
            <HourGrid open={hours} onToggle={(h) => setHours((s) => (s.includes(h) ? s.filter((x) => x !== h) : [...s, h].sort((a, b) => a - b)))} />
            <T size={12} color={c.n600} style={{ marginTop: 12 }}>{hours.length} hour{hours.length === 1 ? '' : 's'} a day · {days.length} day{days.length === 1 ? '' : 's'} a week</T>
          </>
        )}

        {step === 4 && <PortfolioStep p={p} upi={upi} setUpi={setUpi} onChange={reload} />}

        {step === 5 && (
          <>
            <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>This is exactly what a customer sees.</T>
            <View style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.n100 }, shadow.md]}>
              <Img uri={p.portfolio[0]?.imageUrl ?? p.photoUrl} style={{ height: 130 }} />
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <H size={20} style={{ flex: 1 }}>{p.displayName}</H>
                  {p.verification === 'VERIFIED' ? <Tag label="✓ Verified" green /> : <Tag label="Verification pending" />}
                </View>
                <T size={12.5} color={c.n700} style={{ marginTop: 4 }}>{p.personName} · {p.areaName}</T>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <T w="heavy" size={12.5}>★ {p.stats.ratingCount ? p.stats.ratingAvg.toFixed(1) : 'New'}</T>
                  <T size={12.5} color={c.n600}>{p.stats.ratingCount} reviews</T>
                  <T size={12.5} color={c.n600}>{p.yearsExperience} yrs</T>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {p.categories.map((x) => <Tag key={x.id} label={x.name} />)}
                </View>
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.divider }}>
                  {p.services.filter((s) => s.published).map((s) => (
                    <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                      <T size={13}>{s.name}</T>
                      <T w="heavy" size={13} color={c.a700}>{rateLabel(s.rate, s.unit)}</T>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {step === 6 && (
          <View style={{ alignItems: 'center', paddingTop: 30, paddingHorizontal: 6 }}>
            <View style={{ width: 90, height: 90, borderRadius: 999, backgroundColor: c.g300, alignItems: 'center', justifyContent: 'center' }}>
              <T size={38} color={c.g900}>✓</T>
            </View>
            <H size={26} style={{ marginTop: 20, marginBottom: 8 }}>Ready to publish</H>
            <T size={13.5} color={c.n700} style={{ textAlign: 'center', maxWidth: 265, lineHeight: 20 }}>
              Publishing makes your {p.services.filter((s) => s.published).length} services visible to customers searching your {p.categories.length} categories in India.
            </T>
            <View style={{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14, marginTop: 18, alignSelf: 'stretch' }}>
              <Row k="Business" v={p.displayName} />
              <Row k="Area" v={p.areaName} />
              <Row k="Live services" v={String(p.services.filter((s) => s.published).length)} />
              <Row k="Working days" v={p.availabilitySummary.daysLabel} />
              <Row k="Hours" v={p.availabilitySummary.hoursLabel} />
              <Row k="Verification" v={p.verification === 'VERIFIED' ? 'Verified' : 'Pending — you can take bookings meanwhile'} last />
            </View>
          </View>
        )}
      </Scroll>
      <Footer>
        <Btn label={editing ? 'Save' : step === 6 ? 'Publish my profile' : step === 5 ? 'Looks good' : 'Continue'} size="lg" loading={busy} onPress={next} />
      </Footer>
    </Screen>
  );
}

function newDraft(cat: { id: string; name: string; unit: Unit; defaultRate: number; minRate: number; maxRate: number } | undefined): Draft | null {
  if (!cat) return null;
  return { categoryId: cat.id, name: cat.name, description: '', unit: cat.unit, rate: Math.min(cat.maxRate, Math.max(cat.minRate, cat.defaultRate)), published: true };
}

function PortfolioStep({ p, upi, setUpi, onChange }: { p: ProviderMe; upi: string; setUpi: (v: string) => void; onChange: () => Promise<unknown> }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const add = async () => {
    setAdding(true);
    try {
      const url = await pickAndUpload();
      if (url) {
        await api('/provider/portfolio', { body: { imageUrl: url, caption: `${p.categories[0]?.name ?? 'Recent'} work` } });
        await onChange();
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setAdding(false);
    }
  };
  const remove = async (id: string) => {
    await api(`/provider/portfolio/${id}`, { method: 'DELETE' });
    await onChange();
  };
  const uploadDoc = async (type: string) => {
    try {
      const url = await pickAndUpload();
      if (url) {
        await api('/provider/documents', { body: { type, fileUrl: url } });
        await onChange();
        toast('Uploaded. We review documents within 24 hours.');
      }
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const doc = (type: string) => p.documents.find((d) => d.type === type);
  return (
    <>
      <T size={13.5} color={c.n700} style={{ marginBottom: 14 }}>Add photos of finished work. This is the single biggest driver of bookings.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {p.portfolio.map((w) => (
          <View key={w.id} style={{ width: '48.3%' }}>
            <Img uri={w.imageUrl} radius={16} style={{ height: 110 }}>
              <Pressable onPress={() => remove(w.id)} style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 999, backgroundColor: c.n900, alignItems: 'center', justifyContent: 'center' }}>
                <T size={13} color="#fff">✕</T>
              </Pressable>
            </Img>
            <T size={11} color={c.n700} style={{ marginTop: 5 }} numberOfLines={2}>{w.caption}</T>
          </View>
        ))}
        <Pressable onPress={add} disabled={adding} style={{ width: '48.3%', height: 110, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.n400, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <T size={22} color={c.a700}>{adding ? '…' : '+'}</T>
          <T w="bold" size={11.5} color={c.a700}>Add photo</T>
        </Pressable>
      </View>

      <Kicker>Verification documents</Kicker>
      <T size={12.5} color={c.n600} style={{ marginBottom: 10 }}>Verified pros get a badge and rank higher. You can publish now and add these later.</T>
      {[
        ['AADHAAR', 'ID proof (Aadhaar or PAN)'],
        ['ADDRESS_PROOF', 'Address proof'],
      ].map(([type, label]) => {
        const d = doc(type);
        return (
          <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.n100, borderRadius: radius.md, padding: 13, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <T w="bold" size={13.5}>{label}</T>
              <T size={11.5} color={d?.status === 'APPROVED' ? c.g700 : d?.status === 'REUPLOAD' || d?.status === 'REJECTED' ? c.danger : c.n600}>
                {d ? ({ APPROVED: 'Approved', PENDING: 'Under review', REUPLOAD: `Re-upload needed${d.note ? ': ' + d.note : ''}`, REJECTED: 'Rejected' } as Record<string, string>)[d.status] : 'Not uploaded'}
              </T>
            </View>
            {d?.status !== 'APPROVED' && <Btn label={d ? 'Replace' : 'Upload'} size="sm" variant="soft" onPress={() => uploadDoc(type)} style={{ minHeight: 36 }} />}
          </View>
        );
      })}

      <Kicker>Payouts</Kicker>
      <Field label="UPI ID for weekly payouts" value={upi} onChangeText={setUpi} placeholder="name@okhdfcbank" autoCapitalize="none" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }}>
        <View style={{ flex: 1 }}>
          <T w="bold" size={13}>Experience</T>
          <T size={13} color={c.n700} style={{ marginTop: 4 }}>{p.yearsExperience} years · {p.stats.jobsCompleted} jobs completed on AAWRO</T>
        </View>
      </View>
    </>
  );
}

