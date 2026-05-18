import { and, eq, sql } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Hangul from 'hangul-js';
import { AlertTriangle, CheckCircle2, ChevronLeft, Flame, Globe, Play, SkipForward, Trophy } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HangeulKeyboard from '../components/HangeulKeyboard';
import SwipeCard from '../components/SwipeCard';
import { db } from '../db';
import { localPerformance, localUserStats, vocabulary } from '../db/schema';
import { supabase } from '../lib/supabase';
import { syncUserData } from '../lib/sync';

const { width } = Dimensions.get('window');

// Boss Level triggers at this index (0-based), so question 5 = index 4
const BOSS_LEVEL_START_INDEX = 4;

interface GameWord {
  id: number;
  hangeul: string;
  romanization: string | null;
  english: string; // The proposed meaning (Correct OR Distractor)
  realMeaning: string; // The actual truth for verification
  category: string;
  isBoss?: boolean | null;
  difficulty?: string | number | null;
  tags?: string | null;
  audioPath?: string | null;
  distractor: string;
  correctSide: 'left' | 'right';
}

export default function GameScreen() {
  const { category, mode } = useLocalSearchParams<{ category: string; mode?: string }>();
  const router = useRouter();

  const isBossMode = mode === 'boss';

  const [words, setWords] = useState<GameWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bossIndices, setBossIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOn, setGameOn] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [wordResults, setWordResults] = useState<(boolean | null)[]>(new Array(10).fill(null));

  // --- Boss Level State ---
  const [bossInput, setBossInput] = useState('');
  const [bossAttempts, setBossAttempts] = useState(0);
  const [bossResult, setBossResult] = useState<'correct' | 'wrong' | null>(null);
  const [showSkipEncouragement, setShowSkipEncouragement] = useState(false);
  const MAX_BOSS_ATTEMPTS = 3;

  // Computed: is the current question a boss level round?
  const isBossLevel = gameOn && bossIndices.includes(currentIndex);

  // --- Quit Guard (hardware back button + UI back chevron) ---
  const confirmQuit = () => {
    Alert.alert(
      'Quit Session?',
      'Your current progress will be lost. Are you sure you want to leave?',
      [
        { text: 'Keep Playing', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Intercept Android hardware back button only during active gameplay
  React.useEffect(() => {
    if (!gameOn || showResults) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true; // prevent default navigation
    });
    return () => sub.remove();
  }, [gameOn, showResults]);

  useEffect(() => {
    loadGameData();
  }, [category]);

  // Reset boss state on each new question
  useEffect(() => {
    setBossInput('');
    setBossAttempts(0);
    setBossResult(null);
  }, [currentIndex]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const queryData = category
        ? await db.select().from(vocabulary).where(eq(vocabulary.category, category)).orderBy(sql`RANDOM()`).limit(10)
        : await db.select().from(vocabulary).orderBy(sql`RANDOM()`).limit(10);

      // 1. Sort queryData to push Boss/Expert items towards the end
      const sortedWords = [...queryData].sort((a, b) => {
        const difficultyMap: any = { 'Beginner': 0, 'Intermediate': 1, 'Expert': 2 };
        const scoreA = (difficultyMap[a.difficulty] || 0) + (a.isBoss ? 5 : 0);
        const scoreB = (difficultyMap[b.difficulty] || 0) + (b.isBoss ? 5 : 0);
        return scoreA - scoreB;
      });

      // 2. Determine boss indices (2-3 for normal, 10 for boss arena)
      if (isBossMode) {
        setBossIndices(Array.from({ length: 10 }, (_, i) => i));
      } else {
        const indices = new Set<number>();
        const count = Math.floor(Math.random() * 2) + 2; // 2 or 3 boss levels
        while (indices.size < count) {
          // ENSURE: First 3 questions (indices 0,1,2) are never boss levels
          const idx = Math.floor(Math.random() * 7) + 3; // Picks from [3, 9]
          indices.add(idx);
        }
        setBossIndices(Array.from(indices));
      }

      if (!queryData || queryData.length === 0) {
        setLoading(false);
        Alert.alert(
          'District Empty',
          "This category doesn't have enough words yet. Please try another zone!",
          [{ text: 'Back to Hub', onPress: () => router.back() }]
        );
        return;
      }

      const gameWords: GameWord[] = [];
      for (const word of sortedWords) {
        const distractors = await db.select().from(vocabulary)
          .where(and(eq(vocabulary.category, word.category), sql`id != ${word.id}`))
          .orderBy(sql`RANDOM()`).limit(1);

        const distractor = distractors[0]?.english || 'Stay Focused!';
        
        // Randomly decide if we show the CORRECT or INCORRECT meaning on the card
        const showCorrectMeaning = Math.random() > 0.5;
        
        gameWords.push({
          ...word,
          realMeaning: word.english, // Store the actual truth
          // The 'english' property passed to SwipeCard is now the "Proposed Translation"
          english: showCorrectMeaning ? word.english : distractor,
          distractor: distractor,
          // If we show correct meaning -> user swipes RIGHT. If we show distractor -> user swipes LEFT.
          correctSide: showCorrectMeaning ? 'right' : 'left',
        });
      }

      setWords(gameWords);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game data:', error);
      setLoading(false);
      Alert.alert('System Error', 'The linguistic engine stalled. Returning to hub.');
      router.back();
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, { language: 'ko', rate: 0.85, pitch: 1.0 });
  };

  const savePerformance = async (wordId: number, isCorrect: boolean) => {
    if (!userId) return;
    try {
      const existing = await db.select().from(localPerformance)
        .where(and(eq(localPerformance.userId, userId), eq(localPerformance.wordId, wordId)));

      if (existing.length > 0) {
        await db.update(localPerformance).set({
          successCount: isCorrect ? (existing[0].successCount || 0) + 1 : existing[0].successCount,
          failureCount: !isCorrect ? (existing[0].failureCount || 0) + 1 : existing[0].failureCount,
          nextReview: new Date(Date.now() + (isCorrect ? 86400000 : 3600000)),
        }).where(and(eq(localPerformance.userId, userId), eq(localPerformance.wordId, wordId)));
      } else {
        await db.insert(localPerformance).values({
          userId,
          wordId,
          successCount: isCorrect ? 1 : 0,
          failureCount: isCorrect ? 0 : 1,
          nextReview: new Date(Date.now() + (isCorrect ? 86400000 : 3600000)),
        });
      }
    } catch (e) {
      console.error('Save Performance Error', e);
    }
  };

  const isProcessing = React.useRef(false);

  const advanceWord = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    if (currentIndex < words.length - 1) {
      setCurrentIndex(c => c + 1);
      setTimeout(() => { isProcessing.current = false; }, 400);
    } else {
      // 1. Update Local XP record
      if (userId) {
        const pointsGained = score * 10;
        await db.update(localUserStats)
          .set({
            totalXP: sql`${localUserStats.totalXP} + ${pointsGained}`,
            lastSync: new Date()
          })
          .where(eq(localUserStats.userId, userId));

        // 2. Beam to Global Oasis
        syncUserData(userId);
      }

      setShowResults(true);
      isProcessing.current = false;
    }
  };

  // --- Distinct Haptic Signatures ---
  // ✅ Correct: Rising triumph pulse (Light → Medium → Success notification)
  const correctHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 80);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 180);
  };

  // ❌ Wrong: Sharp double-thud stutter (Heavy → Heavy, jarring and abrupt)
  const wrongHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 90);
  };

  // --- Swipe Card Handler (Questions 1–4) ---
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isProcessing.current) return;
    
    const currentWord = words[currentIndex];
    const isCorrect = direction === currentWord.correctSide;

    if (isCorrect) {
      setScore(s => s + 1);
      correctHaptic();
    } else {
      wrongHaptic();
    }

    const newResults = [...wordResults];
    newResults[currentIndex] = isCorrect;
    setWordResults(newResults);

    await savePerformance(currentWord.id, isCorrect);
    advanceWord();
  };

  // --- Boss Level Handlers ---
  const handleBossKeyPress = (key: string) => {
    if (bossResult === 'correct') return;
    Haptics.selectionAsync();

    // Decompose current string into Jamo, add the new one, and re-assemble (NFC normalized)
    const normalizedInput = bossInput.normalize('NFC');
    const currentJamos = Hangul.d(normalizedInput);
    currentJamos.push(key);
    setBossInput(Hangul.a(currentJamos).normalize('NFC'));
  };

  const handleBossBackspace = () => {
    if (bossResult === 'correct') return;
    Haptics.selectionAsync();

    // Decompose, remove last Jamo, and re-assemble (NFC normalized)
    const normalizedInput = bossInput.normalize('NFC');
    const currentJamos = Hangul.d(normalizedInput);
    currentJamos.pop();
    setBossInput(Hangul.a(currentJamos).normalize('NFC'));
  };

  const handleBossSubmit = async () => {
    if (!bossInput.trim() || bossResult === 'correct' || isProcessing.current) return;

    const currentWord = words[currentIndex];
    const target = currentWord.hangeul.trim().replace(/\s/g, '').normalize('NFC');
    const input = bossInput.trim().replace(/\s/g, '').normalize('NFC');

    const isCorrect = input === target;

    if (isCorrect) {
      setBossResult('correct');
      setScore(s => s + 1);
      correctHaptic();

      const newResults = [...wordResults];
      newResults[currentIndex] = true;
      setWordResults(newResults);

      await savePerformance(currentWord.id, true);
      // Auto-advance after short delay to show success state
      setTimeout(() => advanceWord(), 1200);
    } else {
      const newAttempts = bossAttempts + 1;
      setBossAttempts(newAttempts);
      setBossResult('wrong');
      wrongHaptic();
      // Reset wrong state after a moment
      setTimeout(() => {
        setBossResult(null);
        setBossInput('');
      }, 800);

      if (newAttempts >= MAX_BOSS_ATTEMPTS) {
        await savePerformance(currentWord.id, false);
      }
    }
  };

  const handleBossSkip = async () => {
    if (isProcessing.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newResults = [...wordResults];
    newResults[currentIndex] = false;
    setWordResults(newResults);

    await savePerformance(words[currentIndex].id, false);
    setShowSkipEncouragement(true);
    setTimeout(() => {
      setShowSkipEncouragement(false);
      advanceWord();
    }, 1100);
  };

  const startGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameOn(true);
  };

  // ─── Loading Screen ───────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-[#477579] items-center justify-center">
        <LinearGradient colors={['#477579', '#8D9C70', '#273C43']} className="absolute inset-0" />
        <MotiView
          from={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ loop: true, type: 'timing', duration: 1500 }}
          className="items-center"
        >
          <Globe color="white" size={60} opacity={0.2} />
          <Text className="text-white/40 font-black uppercase tracking-[10px] mt-8 text-center">Initializing Vibes</Text>
        </MotiView>
      </View>
    );
  }

  // ─── Results Screen ───────────────────────────────────────────────
  if (showResults) {
    return (
      <View className="flex-1 bg-[#477579]">
        <LinearGradient colors={['#477579', '#8D9C70', '#273C43']} className="absolute inset-0" />
        <SafeAreaView className="flex-1 px-8 items-center justify-center">
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 p-10 rounded-[48px] border border-white/20 items-center w-full"
          >
            <Trophy color="#FFD700" size={80} fill="#FFD700" className="mb-6" />
            <Text className="text-white/20 text-[10px] font-black uppercase tracking-[8px] mb-2 mt-10">Session Summary</Text>
            <Text className="text-white text-5xl text-center my-10" style={{ fontFamily: 'Tenada' }}>SESSION COMPLETE</Text>

            <View className="flex-row items-center gap-6 mb-12">
              <View className="items-center">
                <Text className="text-white text-4xl font-black">{score}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Mastered</Text>
              </View>
              <View className="w-[1px] h-12 bg-white/10" />
              <View className="items-center">
                <Text className="text-white text-4xl font-black">+{score * 10}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Power Gained</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              className="bg-white/20 px-10 py-5 rounded-full border border-white/30"
            >
              <Text className="text-white font-black uppercase tracking-widest">Return to Hub</Text>
            </TouchableOpacity>
          </MotiView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Pre-Game Start Screen ────────────────────────────────────────
  if (!gameOn) {
    return (
      <View className="flex-1 bg-[#477579]">
        <LinearGradient colors={['#477579', '#8D9C70', '#273C43']} className="absolute inset-0" />
        <SafeAreaView className="flex-1 px-8 items-center justify-center">
          <Text className="text-white/20 text-[10px] font-black uppercase tracking-[8px] mb-2">{isBossMode ? 'BOSS CHALLENGE' : 'LEARNING ZONE'}</Text>
          <Text className="text-white text-4xl mb-4 text-center" style={{ fontFamily: 'Tenada' }}>{isBossMode ? 'BOSS ARENA' : (category || 'NEO OASIS')}</Text>
          <Text className="text-white/40 text-sm text-center font-medium tracking-[3px] mb-2 uppercase">{isBossMode ? '10 BOSS GAUNTLET' : '10 Word Learning Session'}</Text>
          <View className="flex-row items-center gap-2 mb-12">
            {!isBossMode && (
              <View className="bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <Text className="text-white/50 text-[9px] font-bold uppercase tracking-widest">Q1–4  Swipe Mode</Text>
              </View>
            )}
            <View className="bg-[#EF5777]/20 px-3 py-1.5 rounded-full border border-[#EF5777]/40">
              <Text className="text-[#EF5777] text-[9px] font-bold uppercase tracking-widest">{isBossMode ? 'Q1–10  Boss Level ⚡' : 'Q5–10  Boss Level ⚡'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={startGame}
            className="bg-white/10 p-12 rounded-full border border-white/15 items-center justify-center"
          >
            <Play color="white" size={48} fill="white" />
          </TouchableOpacity>
          <Text className="text-white/20 text-[10px] font-black uppercase tracking-[4px] mt-8">Tap to Initialize</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Boss Level Screen (Q5–10) ────────────────────────────────────
  if (isBossLevel) {
    const currentWord = words[currentIndex];
    if (!currentWord) return <View className="flex-1 bg-[#477579]" />;

    const canSkip = bossAttempts >= MAX_BOSS_ATTEMPTS;

    return (
      <View className="flex-1 bg-[#477579]">
        <LinearGradient colors={['#2C1654', '#471E7A', '#273C43']} className="absolute inset-0" />

        <SafeAreaView className="flex-1">
          {/* Boss Header */}
          <View className="flex-row justify-between items-center px-8 pt-6 mb-4">
            <TouchableOpacity onPress={confirmQuit}>
              <ChevronLeft color="white" size={28} />
            </TouchableOpacity>
            <View className="items-center">
              <View className="flex-row items-center gap-2 bg-[#EF5777]/20 px-4 py-2 rounded-full border border-[#EF5777]/50">
                <AlertTriangle color="#EF5777" size={14} fill="#EF5777" />
                <Text className="text-[#EF5777] text-[10px] font-black uppercase tracking-widest">Boss Level</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Flame color="#EF5777" size={18} fill="#EF5777" />
              <Text className="text-white font-black text-lg">{score}</Text>
            </View>
          </View>

          {/* Progress Dots */}
          <View className="flex-row justify-center gap-2 mb-6">
            {words.map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  backgroundColor: wordResults[i] === true ? '#00FFC2'
                    : wordResults[i] === false ? '#FF4757'
                      : i === currentIndex ? '#EF5777'
                        : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </View>

          {/* Boss Challenge Card */}
          <View className="flex-1 px-6 justify-center">
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={currentIndex}
              className="bg-white/10 rounded-[40px] border border-white/20 p-8 items-center"
            >
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-[6px] mb-6">
                Type the Korean Word
              </Text>
              <Text className="text-white text-4xl font-black text-center mb-2">
                {currentWord.english}
              </Text>
              <Text className="text-white/30 text-sm mb-8">
                ({currentWord.romanization})
              </Text>

              {/* Input Display */}
              <AnimatePresence>
                <MotiView
                  key={bossResult}
                  from={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={`w-full py-5 rounded-[24px] border-2 items-center mb-6 ${bossResult === 'correct' ? 'border-[#00FFC2] bg-[#00FFC2]/15'
                    : bossResult === 'wrong' ? 'border-[#EF5777] bg-[#EF5777]/15'
                      : 'border-white/20 bg-white/5'
                    }`}
                >
                  {bossResult === 'correct' ? (
                    <View className="flex-row items-center gap-3">
                      <CheckCircle2 color="#00FFC2" size={22} />
                      <Text className="text-[#00FFC2] text-2xl font-black" style={{ fontFamily: 'Tenada' }}>
                        {currentWord.hangeul}
                      </Text>
                    </View>
                  ) : showSkipEncouragement ? (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="items-center px-2"
                    >
                      <Text className="text-[#FFD700] text-base font-black text-center" style={{ fontFamily: 'Tenada' }}>
                        Next time! 화이팅 ✊
                      </Text>
                      <Text className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
                        {currentWord.hangeul} · {currentWord.romanization}
                      </Text>
                    </MotiView>
                  ) : (
                    // Intelligent Jamo-Aware Dots
                    <View className="flex-row gap-2 items-center justify-center flex-wrap px-4">
                      {(() => {
                        const targetWord = currentWord.hangeul.trim().replace(/\s/g, '').normalize('NFC');
                        const inputJamos = Hangul.d(bossInput.normalize('NFC'));
                        const targetSlots = targetWord.split('').map(char => Hangul.d(char));

                        let currentJamoIdx = 0;
                        return targetSlots.map((slotJamos, i) => {
                          const inputForThisSlot = inputJamos.slice(currentJamoIdx, currentJamoIdx + slotJamos.length);
                          const targetForThisSlot = slotJamos;
                          const isCorrect = inputForThisSlot.length === targetForThisSlot.length &&
                            inputForThisSlot.every((j, idx) => j === targetForThisSlot[idx]);
                          const isFilled = inputForThisSlot.length > 0;
                          const displaySyllable = Hangul.a(inputForThisSlot);
                          currentJamoIdx += slotJamos.length;

                          return (
                            <MotiView
                              key={i}
                              from={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              style={{
                                height: 48,
                                minWidth: isFilled ? 48 : 40,
                                borderRadius: 12,
                                backgroundColor: isCorrect ? '#00FFC2'
                                  : isFilled ? 'rgba(255,255,255,0.9)'
                                    : 'rgba(255,255,255,0.08)',
                                borderWidth: isCorrect ? 0 : 1,
                                borderColor: isFilled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                                paddingHorizontal: isFilled ? 12 : 0,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: isCorrect ? '#00FFC2' : 'transparent',
                                shadowOpacity: isCorrect ? 0.8 : 0,
                                shadowRadius: 10,
                                elevation: isCorrect ? 5 : 0,
                              }}
                            >
                              {isFilled && (
                                <Text style={{
                                  fontFamily: 'Tenada',
                                  color: isCorrect ? '#000' : '#1a1a1a',
                                  fontSize: 22,
                                  fontWeight: 'bold'
                                }}>
                                  {displaySyllable}
                                </Text>
                              )}
                            </MotiView>
                          );
                        });
                      })()}
                    </View>
                  )}
                </MotiView>
              </AnimatePresence>

              {/* Attempts & Skip */}
              <View className="flex-row items-center justify-between w-full">
                <View className="flex-row gap-2">
                  {Array.from({ length: MAX_BOSS_ATTEMPTS }).map((_, i) => (
                    <View
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: i < bossAttempts ? '#EF5777' : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </View>
                {canSkip && (
                  <TouchableOpacity
                    onPress={handleBossSkip}
                    className="flex-row items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20"
                  >
                    <SkipForward color="rgba(255,255,255,0.5)" size={14} />
                    <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest">Skip</Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>

            {/* Speak Hint */}
            <TouchableOpacity
              onPress={() => speak(currentWord.hangeul)}
              className="flex-row items-center justify-center gap-2 mt-6"
            >
              <Text className="text-white/20 text-xs uppercase tracking-widest font-bold">Tap to hear pronunciation</Text>
            </TouchableOpacity>
          </View>

          {/* Hangeul Keyboard */}
          <HangeulKeyboard
            onKeyPress={handleBossKeyPress}
            onBackspace={handleBossBackspace}
            onSubmit={handleBossSubmit}
            targetWord={currentWord.hangeul}
            disabled={bossResult === 'correct'}
          />
        </SafeAreaView>
      </View>
    );
  }

  // ─── Swipe Mode Screen (Q1–4) ────────────────────────────────────
  const currentWord = words[currentIndex];
  if (!currentWord) return <View className="flex-1 bg-[#477579]" />;

  return (
    <View className="flex-1 bg-[#477579]">
      <LinearGradient colors={['#477579', '#8D9C70', '#273C43']} className="absolute inset-0" />

      <SafeAreaView className="flex-1">
        {/* Game Header */}
        <View className="flex-row justify-between items-center px-10 pt-6 mb-2">
          <TouchableOpacity onPress={confirmQuit}>
            <ChevronLeft color="white" size={32} />
          </TouchableOpacity>
          {/* Progress Dots */}
          <View className="flex-row gap-2">
            {words.map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  backgroundColor: wordResults[i] === true ? '#00FFC2'
                    : wordResults[i] === false ? '#FF4757'
                      : i === currentIndex ? 'white'
                        : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </View>
          <View className="flex-row items-center gap-2">
            <Flame color="#EF5777" size={20} fill="#EF5777" />
            <Text className="text-white font-black text-xl">{score}</Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-4">
          <AnimatePresence mode="wait">
            <SwipeCard
              key={currentWord.id}
              hangeul={currentWord.hangeul}
              romanization={currentWord.romanization}
              meaning={currentWord.english}
              category={currentWord.category}
              onSwipeLeft={() => handleSwipe('left')}
              onSwipeRight={() => handleSwipe('right')}
            />
          </AnimatePresence>
        </View>

        {/* Directional Hints */}
        <View className="pb-16 px-10 flex-row justify-between items-start gap-x-6">
          <View className="flex-1 items-start">
            <Text className="text-[#EF5777] text-[10px] uppercase font-bold mb-1">Slide Left</Text>
            <Text className="text-white/60 text-base font-bold leading-tight" numberOfLines={2} adjustsFontSizeToFit>
              {currentWord.correctSide === 'right' ? currentWord.distractor : currentWord.realMeaning}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-[#00FFC2] text-[10px] text-right uppercase font-bold mb-1">Slide Right</Text>
            <Text className="text-white/60 text-base font-bold leading-tight text-right" numberOfLines={2} adjustsFontSizeToFit>
              {currentWord.english}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
