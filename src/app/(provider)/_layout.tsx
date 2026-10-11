import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { ICON } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useBookings, useUnreadChats } from '@/lib/queries';

export default function ProviderTabs() {
  const { status, me } = useAuth();
  const unread = useUnreadChats();
  const requests = useBookings('requests');
  if (status === 'signedOut') return <Redirect href="/entry" />;
  if (me && me.role !== 'PROVIDER') return <Redirect href="/" />;
  const tabs = [
    { name: 'dashboard', label: 'Dashboard', icon: ICON.chart },
    { name: 'requests', label: 'Bookings', icon: ICON.list, badge: requests.data?.items.length ?? 0 },
    { name: 'calendar', label: 'Calendar', icon: ICON.cal },
    { name: 'messages', label: 'Messages', icon: ICON.chat, badge: unread },
    { name: 'profile', label: 'Profile', icon: ICON.user },
  ];
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} tabs={tabs} />}>
      {tabs.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}
