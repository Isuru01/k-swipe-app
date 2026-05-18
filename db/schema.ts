import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// 1. Vocabulary Library (The 2,000 words)
export const vocabulary = sqliteTable('vocabulary', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hangeul: text('hangeul').notNull(),
  romanization: text('romanization'), // Helpful for flashcard view
  english: text('english').notNull(),
  category: text('category').notNull(), // e.g., 'K-Drama'
  tags: text('tags'), // Comma-separated or JSON string
  difficulty: integer('difficulty').default(1),
  audioPath: text('audio_path'),
});

// 2. Local User Stats (Synced with Supabase)
export const localUserStats = sqliteTable('user_stats', {
  userId: text('user_id').primaryKey(), // Supabase UID
  proficiencyLevel: text('proficiency_level').default('beginner'),
  totalXP: integer('total_xp').default(0),
  dailyStreak: integer('daily_streak').default(0),
  interests: text('interests'), // JSON string
  lastSync: integer('last_sync', { mode: 'timestamp' }), // Timestamp
});

// 3. Local Performance (The SRS Engine)
export const localPerformance = sqliteTable('local_performance', {
  userId: text('user_id').references(() => localUserStats.userId).notNull(), // Tie records to user
  wordId: integer('word_id').references(() => vocabulary.id).notNull(),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  nextReview: integer('next_review', { mode: 'timestamp' }), // Timestamp for SRS logic
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false), // Flag to determine un-synced data
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.wordId] }) // Unified primary key
  };
});
