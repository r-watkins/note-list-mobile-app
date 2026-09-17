import { Tabs } from 'expo-router';
import { LibraryBig, Settings as SettingsIcon } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { THEME } from '@/theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: THEME.background },
        tabBarStyle: { backgroundColor: THEME.card, borderTopColor: THEME.border },
        tabBarActiveTintColor: THEME.foreground,
        tabBarInactiveTintColor: THEME.mutedForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Icon as={LibraryBig} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon as={SettingsIcon} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
