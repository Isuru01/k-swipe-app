import { eq, sql } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ChevronRight, Flame, Library, Lock, PlayCircle, Sparkles, Star, Trophy, Zap } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinguisticAvatar from '../../components/LinguisticAvatar';
import { db } from '../../db';
import { localPerformance, localUserStats, vocabulary } from '../../db/schema';
import { syncUserData } from '../../lib/sync';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('K-Learner');
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [isKorean, setIsKorean] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalSwipes, setTotalSwipes] = useState(0);
  const [wotd, setWotd] = useState<any>(null);
  const [wotdProgress, setWotdProgress] = useState(0);
  const [wotdPhase, setWotdPhase] = useState(0); // 0: Heard, 1: Identified, 2: Typed
  const [wotdInput, setWotdInput] = useState('');
  const [distractors, setDistractors] = useState<string[]>([]);
  const [level, setLevel] = useState({ en: 'Beginner', ko: '초보자' });
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    loadUserContext();
    const interval = setInterval(() => {
      setIsKorean(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'K-Learner';
      setUserName(profileName);

      const stats = await db.select().from(localUserStats).where(eq(localUserStats.userId, user.id));
      if (stats.length > 0) {
        const s = stats[0];
        const now = new Date();
        const lastSync = s.lastSync ? new Date(s.lastSync) : null;
        if (lastSync) {
          const diffDays = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 3600 * 24));
          setStreak(diffDays <= 1 ? (s.dailyStreak || 0) : 0);
        }

        // Map Level with Robust Fallback
        const levelMap: any = {
          'Beginner': { en: 'Beginner', ko: '초보자' },
          'beginner': { en: 'Beginner', ko: '초보자' },
          'Intermediate': { en: 'Intermediate', ko: '중급자' },
          'intermediate': { en: 'Intermediate', ko: '중급자' },
          'Expert': { en: 'Expert', ko: '전문가' },
          'expert': { en: 'Expert', ko: '전문가' }
        };
        const currentLevel = levelMap[s.proficiencyLevel] || levelMap['Beginner'];
        setLevel(currentLevel);

        // Parse Interests
        if (s.interests) {
          try { setInterests(JSON.parse(s.interests)); } catch (e) { }
        }
      }

      const performance = await db.select().from(localPerformance).where(eq(localPerformance.userId, user.id));
      const mastered = performance.filter(p => (p.successCount || 0) > (p.failureCount || 0)).length;
      setMasteredCount(mastered);
      setPoints(performance.reduce((acc, curr) => acc + (curr.successCount || 0) * 10, 0));

      const swipes = performance.reduce((acc, curr) => acc + (curr.successCount || 0) + (curr.failureCount || 0), 0);
      setTotalSwipes(swipes);

      // Word of the Day Logic (Date-seeded)
      const allVocab = await db.select().from(vocabulary);
      if (allVocab.length > 0) {
        const date = new Date();
        const seed = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
        const index = seed % allVocab.length;
        const selectedWotd = allVocab[index];
        setWotd(selectedWotd);

        // Find progress for this specific word
        const wotdPerf = performance.find(p => p.wordId === selectedWotd.id);
        if (wotdPerf) {
          const total = (wotdPerf.successCount || 0) + (wotdPerf.failureCount || 0);
          const ratio = (wotdPerf.successCount || 0) > 0 ? 1 : 0; // Simplified for daily challenge
          setWotdProgress(Math.round(ratio * 100));
          if (ratio === 1) setWotdPhase(3);
        }

        // Generate distractors for phase 1
        const otherWords = allVocab.filter(v => v.id !== selectedWotd.id);
        const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
        setDistractors([selectedWotd.english, shuffled[0].english, shuffled[1].english].sort(() => 0.5 - Math.random()));
      }

    } catch (e) {
      console.error('Failed to load dashboard context', e);
    }
  };

  const handleStart = (mode?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'boss' && totalSwipes < 50) return;
    router.push({ pathname: '/game', params: { mode } });
  };

  const handleWotdAction = async (type: 'echo' | 'identity' | 'forge', value?: string) => {
    if (!wotd) return;

    if (type === 'echo') {
      Speech.speak(wotd.hangeul);
      if (wotdPhase === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setWotdPhase(1);
        setWotdProgress(33);
      }
    } else if (type === 'identity') {
      if (value === wotd.english) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setWotdPhase(2);
        setWotdProgress(66);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (type === 'forge') {
      if (wotdInput.toLowerCase().trim() === wotd.romanization.toLowerCase().trim()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Record the win
          await db.insert(localPerformance).values({
            userId: user.id,
            wordId: wotd.id,
            successCount: 1,
            failureCount: 0,
            isSynced: false,
            nextReview: new Date(Date.now() + 86400000)
          }).onConflictDoUpdate({
            target: [localPerformance.userId, localPerformance.wordId],
            set: {
              successCount: sql`${localPerformance.successCount} + 1`,
              isSynced: false
            }
          });

          // Update Local User Stats XP
          await db.update(localUserStats)
            .set({ 
              totalXP: sql`${localUserStats.totalXP} + 50`,
              lastSync: new Date()
            })
            .where(eq(localUserStats.userId, user.id));

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setWotdPhase(3);
          setWotdProgress(100);
          setPoints(prev => prev + 50); // Immediate UI update
          
          // Beam to Global Oasis
          syncUserData(user.id);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <View className="flex-1 bg-[#1A1A1A]">
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-4">
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px]">My Dashboard</Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-white text-3xl font-black" style={{ fontFamily: 'Tenada' }}>
                  HELLO, <Text className="text-[#00FFC2]">{userName.split(' ')[0].toUpperCase()}</Text>
                </Text>
              </View>

              <View className="flex-row items-center gap-2 mt-2">
                <View className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  <Text className="text-white text-[8px] font-black uppercase tracking-widest">{level?.en || 'Beginner'} - {level?.ko || '초보자'}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {interests.slice(0, 2).map((it) => (
                    <View key={it} className="bg-[#00FFC2]/15 px-2 py-1 rounded-md border border-[#00FFC2]/20">
                      <Text className="text-[#00FFC2] text-[7px] font-black uppercase">{it}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} className="shrink-0">
              <View className="bg-[#00FFC2]/10 p-1 rounded-full border border-[#00FFC2]/30 overflow-hidden">
                <LinguisticAvatar name={userName} size={48} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Word of the Day Card */}
          <View className="px-6 mt-8">
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-[#262626] rounded-[40px] p-8 border border-white/10 overflow-hidden"
            >
              <View className="absolute top-0 right-0 p-8 opacity-10">
                <Text className="text-white text-9xl font-black" style={{ fontFamily: 'Tenada' }}>
                  {wotd?.hangeul?.[0]}
                </Text>
              </View>

              <View className="flex-row items-center gap-2 mb-4">
                <View className={`px-3 py-1 rounded-full border ${wotdPhase === 3 ? 'bg-[#00FFC2]/20 border-[#00FFC2]/40' : 'bg-[#EF5777]/20 border-[#EF5777]/40'}`}>
                  <Text className={`${wotdPhase === 3 ? 'text-[#00FFC2]' : 'text-[#EF5777]'} text-[8px] font-black uppercase tracking-widest`}>
                    {wotdPhase === 3 ? 'Mission Complete' : 'Active Mission'}
                  </Text>
                </View>
                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Word of the Day</Text>
              </View>

              <AnimatePresence exitBeforeEnter>
                {wotdPhase === 3 ? (
                  <MotiView 
                    key="complete"
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <TouchableOpacity onPress={() => handleWotdAction('echo')}>
                       <Text className="text-white text-6xl mb-1" style={{ fontFamily: 'Tenada' }}>{wotd?.hangeul || '친구'}</Text>
                       <Text className="text-[#00FFC2] text-xl font-medium tracking-[2px]">{wotd?.romanization || 'chingu'}</Text>
                       <Text className="text-white/40 text-xs mt-1 italic">{wotd?.english || 'Friend'}</Text>
                    </TouchableOpacity>
                    
                    <View className="absolute top-0 right-0">
                      <Star color="#FFD32A" size={24} fill="#FFD32A" />
                    </View>
                  </MotiView>
                ) : (
                  <MotiView key="active">
                    <TouchableOpacity onPress={() => handleWotdAction('echo')}>
                      <Text className="text-white text-6xl mb-1" style={{ fontFamily: 'Tenada' }}>{wotd?.hangeul || '친구'}</Text>
                      {wotdPhase > 0 && (
                        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Text className="text-[#00FFC2] text-xl font-medium tracking-[2px]">{wotd?.romanization || 'chingu'}</Text>
                          <Text className="text-white/40 text-xs mt-1 italic">{wotd?.english || 'Friend'}</Text>
                        </MotiView>
                      )}
                    </TouchableOpacity>

                    {wotdPhase === 1 && (
                      <MotiView 
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="mt-6 flex-row flex-wrap gap-2"
                      >
                        {distractors.map((d, i) => (
                          <TouchableOpacity 
                            key={i}
                            onPress={() => handleWotdAction('identity', d)}
                            className="bg-white/5 px-4 py-2 rounded-full border border-white/10"
                          >
                            <Text className="text-white/60 text-[10px] font-bold uppercase">{d}</Text>
                          </TouchableOpacity>
                        ))}
                      </MotiView>
                    )}

                    {wotdPhase === 2 && (
                      <MotiView 
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="mt-6"
                      >
                        <View className="bg-black/40 border border-[#00FFC2]/30 rounded-2xl p-4 flex-row items-center">
                          <TextInput 
                            placeholder="Type Romanization..."
                            placeholderTextColor="rgba(255,255,255,0.1)"
                            value={wotdInput}
                            onChangeText={setWotdInput}
                            className="flex-1 text-white font-bold"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity 
                            onPress={() => handleWotdAction('forge')}
                            className="bg-[#00FFC2] p-2 rounded-xl"
                          >
                            <Zap color="black" size={16} />
                          </TouchableOpacity>
                        </View>
                      </MotiView>
                    )}
                  </MotiView>
                )}
              </AnimatePresence>

              <View className="mt-8">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest">Mastery Level</Text>
                  <Text className="text-[#00FFC2] text-[10px] font-bold">{wotdProgress}%</Text>
                </View>
                <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <MotiView
                    from={{ width: '0%' }}
                    animate={{ width: `${wotdProgress}%` }}
                    className="h-full bg-[#00FFC2]"
                  />
                </View>
              </View>
            </MotiView>
          </View>

          {/* Hangeul Forge Access Card */}
          <View className="px-6 mt-10">
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/forge');
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#00FFC215', '#00FFC205']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[40px] border border-[#00FFC2]/20 p-8 overflow-hidden"
              >
                {/* Background Character Grid (Purely Visual) */}
                <View className="absolute right-[-20] top-[-10] opacity-5">
                   <Text className="text-[#00FFC2] text-9xl font-black">ㄱㄴㅏㅑ</Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-6">
                    <View className="bg-[#00FFC2]/20 w-10 h-10 rounded-full items-center justify-center mb-4 border border-[#00FFC2]/40">
                       <Sparkles color="#00FFC2" size={20} fill="#00FFC2" />
                    </View>
                    <Text className="text-white text-2xl font-black" style={{ fontFamily: 'Tenada' }}>HANGEUL FORGE</Text>
                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-[2px] mt-1">Master the 24 Neural Characters</Text>
                    
                    <View className="flex-row items-center gap-2 mt-6">
                      <View className="bg-[#00FFC2] px-4 py-2 rounded-full">
                        <Text className="text-black text-[9px] font-black uppercase tracking-widest">Start Learning</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-24 h-24 bg-black/40 rounded-3xl items-center justify-center border border-white/5 shadow-2xl">
                     <Text className="text-white text-4xl mb-1" style={{ fontFamily: 'Tenada' }}>ㄱ</Text>
                     <Text className="text-white/20 text-[8px] font-black uppercase tracking-widest">Giyeok</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Start Menu */}
          <View className="px-6 mt-10">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px] mb-4 ml-2">Quick Start</Text>

            <View className="gap-y-3">
              {/* Random Mix */}
              <TouchableOpacity
                onPress={() => handleStart()}
                className="bg-[#262626] p-5 rounded-[28px] border border-white/5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-[#EF5777]/10 p-3 rounded-2xl">
                    <PlayCircle color="#EF5777" size={24} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">Vibe Check</Text>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Mixed Training Mode</Text>
                  </View>
                </View>
                <ChevronRight color="white" size={20} opacity={0.2} />
              </TouchableOpacity>

              {/* Hangeul Strike (New) */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/game', params: { category: 'Alphabet' } });
                }}
                className="bg-[#262626] p-5 rounded-[28px] border border-white/5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-[#00FFC2]/10 p-3 rounded-2xl">
                    <Zap color="#00FFC2" size={24} fill="#00FFC2" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">Hangeul Strike</Text>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Alphabet Speed Drill</Text>
                  </View>
                </View>
                <ChevronRight color="white" size={20} opacity={0.2} />
              </TouchableOpacity>

              {/* My Deck */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/deck')}
                className="bg-[#262626] p-5 rounded-[28px] border border-white/5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-[#FFD32A]/10 p-3 rounded-2xl">
                    <Library color="#FFD32A" size={24} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">My Library</Text>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Review Saved Phrases</Text>
                  </View>
                </View>
                <ChevronRight color="white" size={20} opacity={0.2} />
              </TouchableOpacity>

              {/* Boss Arena (Locked feature) */}
              <TouchableOpacity
                onPress={() => handleStart('boss')}
                className={`p-5 rounded-[28px] border flex-row items-center justify-between ${totalSwipes < 50 ? 'bg-black/20 border-white/5 opacity-60' : 'bg-[#FFD32A]/10 border-[#FFD32A]/30'}`}
              >
                <View className="flex-row items-center gap-4">
                  <View className={`p-3 rounded-2xl ${totalSwipes < 50 ? 'bg-white/5' : 'bg-[#FFD32A]/20'}`}>
                    {totalSwipes < 50 ? <Lock color="rgba(255,255,255,0.3)" size={24} /> : <Trophy color="#FFD32A" size={24} />}
                  </View>
                  <View>
                    <Text className={`text-lg font-bold ${totalSwipes < 50 ? 'text-white/30' : 'text-white'}`}>Boss Arena</Text>
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${totalSwipes < 50 ? 'text-white/10' : 'text-[#FFD32A]/60'}`}>
                      {totalSwipes < 50 ? `Unlock at 50 Swipes (${totalSwipes}/50)` : 'Hardcore 10-Boss Run'}
                    </Text>
                  </View>
                </View>
                {totalSwipes >= 50 && <ChevronRight color="#FFD32A" size={20} opacity={0.8} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Summary */}
          <View className="flex-row px-6 mt-10 mb-20 gap-x-3">
            <View className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5">
              <Flame color="#EF5777" size={16} fill="#EF5777" />
              <Text className="text-white text-xl font-black mt-1">{streak}</Text>
              <Text className="text-white/30 text-[7px] font-bold uppercase tracking-widest">Hot Streak</Text>
            </View>
            <View className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5">
              <Star color="#00FFC2" size={16} fill="#00FFC2" />
              <Text className="text-white text-xl font-black mt-1">{masteredCount}</Text>
              <Text className="text-white/30 text-[7px] font-bold uppercase tracking-widest">Words Mastered</Text>
            </View>
            <View className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5">
              <Zap color="#FFD32A" size={16} fill="#FFD32A" />
              <Text className="text-white text-xl font-black mt-1">{points}</Text>
              <Text className="text-white/30 text-[7px] font-bold uppercase tracking-widest">Linguistic XP</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
