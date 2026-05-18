import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { localPerformance, localUserStats } from '../db/schema';
import { supabase } from './supabase';

export async function syncUserData(userId: string) {
  try {
    console.log('Starting sync for user:', userId);

    // 1. Sync Profile Stats
    const localStats = await db.select()
      .from(localUserStats)
      .where(eq(localUserStats.userId, userId))
      .limit(1);

    if (localStats.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const metadata = user?.user_metadata;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: metadata?.full_name || user?.email?.split('@')[0],
          proficiency_level: localStats[0].proficiencyLevel?.toLowerCase(),
          daily_streak: localStats[0].dailyStreak,
          total_xp: localStats[0].totalXP || 0,
          interests: JSON.parse(localStats[0].interests || '[]'),
        });

      if (!profileError) {
        await db.update(localUserStats)
          .set({ lastSync: new Date() })
          .where(eq(localUserStats.userId, userId));
        console.log('Profile sync complete.');
      }
    }

    // 2. Sync Performance Data
    const unsyncedData = await db.select()
      .from(localPerformance)
      .where(and(
        eq(localPerformance.isSynced, false),
        eq(localPerformance.userId, userId)
      ));

    if (unsyncedData.length > 0) {
      console.log(`Syncing ${unsyncedData.length} performance records...`);
      
      const { error } = await supabase
        .from('user_performance')
        .upsert(
          unsyncedData.map(record => ({
            user_id: record.userId,
            word_id: record.wordId,
            success_count: record.successCount,
            failure_count: record.failureCount,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: record.nextReview?.toISOString(),
          })),
          { onConflict: 'user_id,word_id' }
        );

      if (!error) {
        // Mark as synced locally
        for (const record of unsyncedData) {
          await db.update(localPerformance)
            .set({ isSynced: true })
            .where(eq(localPerformance.wordId, record.wordId));
        }
        console.log('Performance sync complete.');
      } else {
        if (error.code === 'PGRST205') {
          console.warn('⚠️  Supabase Sync: Table "user_performance" missing on remote. Please run migrations on Supabase.');
        } else {
          console.error('Supabase sync error:', error.message);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Sync process failed:', err);
    return { success: false, error: err };
  }
}
