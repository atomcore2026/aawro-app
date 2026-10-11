import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Btn, Field, Footer, Loading, Screen, Scroll, T, TopBar, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { pickAndUpload } from '@/lib/pickImage';
import { ProviderMe, useProviderMe } from '@/lib/provider';
import { c, radius } from '@/lib/theme';

/** Edit business profile: the public listing. */
export default function Business() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: p } = useProviderMe();
  const [f, setF] = useState({ displayName: '', personName: '', areaName: '', workingHoursLabel: '', about: '', yearsExperience: '', photoUrl: '' as string | null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (p) setF({ displayName: p.displayName, personName: p.personName, areaName: p.areaName, workingHoursLabel: p.workingHoursLabel ?? '', about: p.about, yearsExperience: String(p.yearsExperience || ''), photoUrl: p.photoUrl });
  }, [p]);
  if (!p) return <Screen><Loading /></Screen>;
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const fresh = await api<ProviderMe>('/provider/me', {
        method: 'PATCH',
        body: {
          displayName: f.displayName.trim(),
          personName: f.personName.trim(),
          areaName: f.areaName.trim(),
          workingHoursLabel: f.workingHoursLabel.trim() || undefined,
          about: f.about.trim(),
          yearsExperience: Number(f.yearsExperience) || 0,
          photoUrl: f.photoUrl ?? undefined,
        },
      });
      qc.setQueryData(['provider-me'], fresh);
      qc.invalidateQueries({ queryKey: ['provider', p.id] });
      toast('Saved. Your card is updated everywhere.');
      router.back();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Edit business profile" subtitle="This is your public listing" />
      <Scroll contentStyle={{ paddingTop: 12 }}>
        <Pressable
          onPress={async () => {
            try {
              const url = await pickAndUpload({ aspect: [1, 1] });
              if (url) setF((s) => ({ ...s, photoUrl: url }));
            } catch (e) {
              toast((e as Error).message);
            }
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}
        >
          <Avatar uri={f.photoUrl} name={f.personName} size={62} />
          <T w="bold" size={13.5} color={c.a700}>Change photo</T>
        </Pressable>
        <Field label="Business name" value={f.displayName} onChangeText={set('displayName')} />
        <View style={{ height: 13 }} />
        <Field label="Your name" value={f.personName} onChangeText={set('personName')} />
        <View style={{ height: 13 }} />
        <Field label="Service area" value={f.areaName} onChangeText={set('areaName')} />
        <View style={{ height: 13 }} />
        <Field label="Working hours (shown on your card)" value={f.workingHoursLabel} onChangeText={set('workingHoursLabel')} placeholder={p.availabilitySummary.hoursLabel} />
        <View style={{ height: 13 }} />
        <Field label="Years of experience" value={f.yearsExperience} onChangeText={set('yearsExperience')} keyboardType="number-pad" maxLength={2} />
        <View style={{ height: 13 }} />
        <Field label="About your work" value={f.about} onChangeText={set('about')} multiline maxLength={1000} />
        <View style={{ backgroundColor: c.a100, borderRadius: radius.md, padding: 13, marginTop: 14 }}>
          <T size={12.5} color={c.a900} style={{ lineHeight: 18 }}>Saving updates your card everywhere customers see you — search results, your profile and every open booking.</T>
        </View>
      </Scroll>
      <Footer>
        <Btn label="Save changes" size="lg" loading={busy} onPress={save} disabled={!f.displayName.trim()} />
      </Footer>
    </Screen>
  );
}
