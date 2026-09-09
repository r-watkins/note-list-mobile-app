require('react-native-reanimated').setUpTests();

// expo-crypto's native module resolves to a no-op stub under Jest (no crash, but
// randomUUID() silently returns undefined) - use Node's own real randomUUID so
// src/lib/id.ts's generateId() produces genuine, valid ids in tests too.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));
