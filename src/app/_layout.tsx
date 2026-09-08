import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { NAV_THEME, THEME } from '@/theme/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // drizzle-orm@1.0.0-rc.4's useMigrations() types require a `journal` field that
  // drizzle-kit's generated expo migrations.js does not emit and the runtime
  // implementation never reads (confirmed in node_modules/drizzle-orm/expo-sqlite/migrator.js).
  const { success, error } = useMigrations(
    db,
    migrations as unknown as Parameters<typeof useMigrations>[1],
  );

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: THEME.background,
          padding: 24,
        }}
      >
        <Text style={{ color: THEME.foreground, textAlign: 'center' }}>
          Something went wrong preparing the database. Please restart the app.
        </Text>
      </View>
    );
  }

  if (!success) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: THEME.background }}>
      <ThemeProvider value={NAV_THEME}>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { flex: 1, backgroundColor: THEME.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
          <PortalHost />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
