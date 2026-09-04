import { Tabs } from 'expo-router';

import { THEME } from '@/theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: THEME.background },
        tabBarStyle: { backgroundColor: THEME.card, borderTopColor: THEME.border },
        tabBarActiveTintColor: THEME.foreground,
        tabBarInactiveTintColor: THEME.mutedForeground,
      }}
    >
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
