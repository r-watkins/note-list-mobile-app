require('react-native-reanimated').setUpTests();

// Without this, any component calling useSafeAreaInsets()/useSafeAreaFrame() outside a
// <SafeAreaProvider> throws "No safe area value available" under Jest - the library's own
// mock (recommended in its docs) makes those hooks fall back to sensible defaults instead.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// expo-crypto's native module resolves to a no-op stub under Jest (no crash, but
// randomUUID() silently returns undefined) - use Node's own real randomUUID so
// src/lib/id.ts's generateId() produces genuine, valid ids in tests too.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));
