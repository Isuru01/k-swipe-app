import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const expoDb = openDatabaseSync('kswipe.db', { enableChangeListener: true });

/**
 * Safe Schema Evolution
 * Call this only after migrations are confirmed to avoid Splash screen lock.
 */
export const ensureXpColumn = () => {
  try {
    expoDb.execSync('ALTER TABLE user_stats ADD COLUMN total_xp INTEGER DEFAULT 0;');
    console.log('🏙️ Local Oasis: Identity XP column evolved.');
  } catch (e) {
    // Column already exists or table not ready, ignore
  }
};

export const db = drizzle(expoDb, { schema });
