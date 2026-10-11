import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { ICON } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useUnreadChats } from '@/lib/queries';

export default function CustomerTabs() {
  const { status, me } = useAuth();
  const unread = useUnreadChats();
  if (status === 'signedOut') return <Redirect href="/entry" />;
  if (me && me.role !== 'CUSTOMER') return <Redirect href="/" />;
  const tabs = [
    { name: 'home', label: 'Home', icon: ICON.home },
    { name: 'explore', label: 'Explore', icon: ICON.grid },
    { name: 'bookings', label: 'Bookings', icon: ICON.list },
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
