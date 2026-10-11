import { router } from 'expo-router';
import { View } from 'react-native';
import { ProviderCardView } from '@/components/ProviderCard';
import { Empty, ErrorState, Loading, Screen, Scroll, TopBar, useToast } from '@/components/ui';
import { useSaved } from '@/lib/queries';

export default function Saved() {
  const toast = useToast();
  const saved = useSaved();
  const list = saved.data ?? [];
  return (
    <Screen>
      <TopBar title="Saved" subtitle={`${list.length} provider${list.length === 1 ? '' : 's'}`} large />
      {saved.isPending ? (
        <Loading />
      ) : saved.error ? (
        <ErrorState error={saved.error} onRetry={saved.refetch} />
      ) : (
        <Scroll refreshing={saved.isRefetching} onRefresh={saved.refetch} contentStyle={{ paddingTop: 10 }}>
          {!list.length ? (
            <Empty glyph="♡" title="No saved providers" line="Tap the heart on a provider card to keep them here for next time." action="Browse providers" onAction={() => router.push('/(customer)/explore')} />
          ) : (
            <View style={{ gap: 12 }}>
              {list.filter((p) => p.name).map((p) => (
                <ProviderCardView key={p.id} p={p} saved onToggleSave={async () => toast((await saved.toggle(p.id)) ? 'Saved' : 'Removed from saved')} />
              ))}
            </View>
          )}
        </Scroll>
      )}
    </Screen>
  );
}

