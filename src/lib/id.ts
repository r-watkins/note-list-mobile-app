import * as Crypto from 'expo-crypto';

/** Collision-resistant client-generated ID for primary keys (spec §8.2). */
export function generateId(): string {
  return Crypto.randomUUID();
}
