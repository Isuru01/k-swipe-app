import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Text, View, TextInput, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../db';
import { localUserStats } from '../db/schema';
import { syncUserData } from '../lib/sync';
import { supabase } from '../lib/supabase';
import * as Hangul from 'hangul-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { ChevronRight, Brain, CheckCircle2, Heart, Music, Tv2, Briefcase, Plane, Coffee } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const BACKGROUND_WORDS = [
  { ko: '한글', en: 'HANGEUL' },
  { ko: '친구', en: 'FRIEND' },
  { ko: '사랑', en: 'LOVE' },
  { ko: '케이팝', en: 'K-POP' },
  { ko: '연애', en: 'DATING' },
  { ko: '여행', en: 'TRAVEL' },
  { ko: '음식', en: 'FOOD' },
  { ko: '드라마', en: 'DRAMA' },
  { ko: '서울', en: 'SEOUL' },
  { ko: '열정', en: 'PASSION' },
];

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 1,
    question: "Which one means 'Hello'?",
    options: [
      { id: 'a', label: '안녕하세요', correct: true },
      { id: 'b', label: '감사합니다', correct: false },
      { id: 'c', label: '사랑해요', correct: false },
    ]
  },
  {
    id: 2,
    question: "What does '학교' mean?",
    options: [
      { id: 'a', label: 'Office', correct: false },
      { id: 'b', label: 'School', correct: true },
      { id: 'c', label: 'Library', correct: false },
    ]
  },
  {
    id: 3,
    question: "What refers to 'Friend'?",
    options: [
      { id: 'a', label: '선생님', correct: false },
      { id: 'b', label: '부모님', correct: false },
      { id: 'c', label: '친구', correct: true },
    ]
  }
];

const INTERESTS = [
  { id: 'casual', label: 'Casual', ko: '일상', icon: Coffee, color: '#FFD32A' },
  { id: 'dating', label: 'Dating', ko: '연애', icon: Heart, color: '#EF5777' },
  { id: 'k-drama', label: 'K-Drama', ko: '드라마', icon: Tv2, color: '#00E5E5' },
  { id: 'k-pop', label: 'K-Pop', ko: '케이팝', icon: Music, color: '#7158e2' },
  { id: 'work', label: 'Work', ko: '업무', icon: Briefcase, color: '#3ae374' },
  { id: 'travel', label: 'Travel', ko: '여행', icon: Plane, color: '#18dcff' },
];

const LEVEL_MAP = {
  0: { en: 'Beginner', ko: '초보자', color: '#8D9C70' },
  1: { en: 'Beginner', ko: '초보자', color: '#8D9C70' },
  2: { en: 'Intermediate', ko: '중급자', color: '#00D1FF' },
  3: { en: 'Expert', ko: '전문가', color: '#FFD32A' },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0); // 0: Name, 1: Quiz, 2: Interests, 3: Finale
  const [name, setName] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const router = useRouter();

  // Animation for scrolling background words
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Memoize randomized styles for background words
  const randomizedWords = useMemo(() => {
    return [...BACKGROUND_WORDS, ...BACKGROUND_WORDS, ...BACKGROUND_WORDS].map((word) => ({
      ...word,
      id: Math.random().toString(),
      fontSize: Math.floor(Math.random() * (40 - 24 + 1)) + 24,
      opacity: Math.random() * (0.05 - 0.02) + 0.02,
      letterSpacing: Math.floor(Math.random() * (20 - 10 + 1)) + 10,
    }));
  }, []);

  const SLOT_HEIGHT = 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollAnim, {
          toValue: -randomizedWords.length * SLOT_HEIGHT / 2,
          duration: 80000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleQuizAnswer = (isCorrect: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCorrect) setCorrectAnswers(prev => prev + 1);

    if (quizIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStep(2);
    }
  };

  const toggleInterest = (id: string) => {
    Haptics.selectionAsync();
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, id]);
      }
    }
  };

  const finalizeOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update profile
    await supabase.auth.updateUser({
      data: { full_name: name }
    });

    const level = LEVEL_MAP[correctAnswers as keyof typeof LEVEL_MAP].en;

    await db.insert(localUserStats).values({
      userId: user.id,
      proficiencyLevel: level,
      interests: JSON.stringify(selectedInterests),
      dailyStreak: 1,
      lastSync: new Date(),
    }).onConflictDoUpdate({
      target: localUserStats.userId,
      set: {
        proficiencyLevel: level,
        interests: JSON.stringify(selectedInterests),
        lastSync: new Date(),
      }
    });

    // Beam to Global Oasis immediately
    await syncUserData(user.id);

    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-[#0D0D0D]">
      {/* Dynamic Word Matrix Background */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          {randomizedWords.map((word, i) => (
            <View key={i} className="justify-center items-center px-10" style={{ height: SLOT_HEIGHT }}>
               <Text 
                 numberOfLines={1}
                 adjustsFontSizeToFit
                 className="text-white font-black uppercase" 
                 style={{ 
                   fontFamily: 'Tenada', 
                   fontSize: word.fontSize, 
                   opacity: word.opacity,
                   letterSpacing: word.letterSpacing,
                   width: '100%',
                   textAlign: 'center'
                 }}
               >
                 {word.ko} {word.en}
               </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Primary Gradients */}
      <View className="absolute inset-0">
        <MotiView
          animate={{ opacity: 0.1, scale: [1, 1.2, 1] }}
          transition={{ type: 'timing', duration: 10000, loop: true }}
          className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full"
          style={{ backgroundColor: '#00FFC2' }}
        />
        <MotiView
          animate={{ opacity: 0.1, scale: [1, 1.2, 1] }}
          transition={{ type: 'timing', duration: 8000, loop: true }}
          className="absolute bottom-[-100] left-[-100] w-96 h-96 rounded-full"
          style={{ backgroundColor: '#EF5777' }}
        />
      </View>
      
      <SafeAreaView className="flex-1">
        <AnimatePresence exitBeforeEnter>
          {/* STEP 0: IDENTITY */}
          {step === 0 && (
            <MotiView 
              key="step0"
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 px-8 justify-center"
            >
              <MotiView 
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                className="bg-[#1A1A1A] rounded-[48px] border border-white/5 p-12 shadow-2xl"
              >
                <Text className="text-[#00FFC2] text-[10px] font-black uppercase tracking-[8px] mb-2">Welcome</Text>
                <Text className="text-white text-6xl mb-12" style={{ fontFamily: 'Tenada' }}>YOUR NAME</Text>
                
                <View className="bg-black/40 border border-white/5 h-20 justify-center mb-10" style={{ borderRadius: 999 }}>
                  <TextInput
                    placeholder="Enter your full name..."
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    className="text-white text-2xl font-bold px-8 h-full"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  />
                </View>

                <TouchableOpacity 
                  disabled={!name.trim()}
                  onPress={() => setStep(1)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={name.trim() ? ['#00FFC2', '#00DFB0'] : ['#1A1A1A', '#1A1A1A']}
                    className="h-16 rounded-full flex-row items-center justify-center shadow-xl"
                    style={{ borderRadius: 999 }}
                  >
                    <Text className={`font-black uppercase tracking-widest mr-2 text-base ${name.trim() ? 'text-black' : 'text-white/20'}`}>Begin Placement</Text>
                    <ChevronRight color={name.trim() ? 'black' : 'rgba(255,255,255,0.1)'} size={20} />
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </MotiView>
          )}

          {/* STEP 1: QUIZ */}
          {step === 1 && (
            <MotiView 
              key="step1"
              from={{ opacity: 0, translateX: width }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -width }}
              className="flex-1 px-6 pt-12"
            >
              <View className="flex-row justify-between items-center mb-10 px-4">
                <View>
                  <Text className="text-[#EF5777] text-[10px] font-black uppercase tracking-[8px] mb-1">Aptitude Trial</Text>
                  <Text className="text-white text-4xl" style={{ fontFamily: 'Tenada' }}>PHASE {quizIndex + 1}/3</Text>
                </View>
                <View className="bg-[#EF5777]/10 p-4 rounded-3xl border border-[#EF5777]/20">
                  <Brain color="#EF5777" size={32} />
                </View>
              </View>

              <MotiView 
                from={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={quizIndex}
                className="bg-[#1A1A1A] border border-white/5 rounded-[48px] p-12 mb-8 shadow-2xl"
              >
                <Text className="text-white/20 text-[9px] font-black uppercase tracking-[4px] mb-4">Linguistic Challenge</Text>
                <Text className="text-white text-3xl font-black mb-12 leading-10" style={{ fontFamily: 'Tenada' }}>{DIAGNOSTIC_QUESTIONS[quizIndex].question}</Text>
                
                <View className="gap-y-4">
                  {DIAGNOSTIC_QUESTIONS[quizIndex].options.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleQuizAnswer(opt.correct)}
                      activeOpacity={0.8}
                      className="bg-black/30 border border-white/5 h-20 rounded-full items-center justify-center px-4"
                      style={{ borderRadius: 999 }}
                    >
                      <Text className="text-white text-xl font-black text-center">{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </MotiView>
            </MotiView>
          )}

          {/* STEP 2: INTERESTS */}
          {step === 2 && (
            <MotiView 
              key="step2"
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -20 }}
              className="flex-1 px-6 pt-12"
            >
              <View className="mb-10 px-4">
                <Text className="text-[#00FFC2] text-[10px] font-black uppercase tracking-[8px] mb-1">Ambition Mapping</Text>
                <Text className="text-white text-5xl" style={{ fontFamily: 'Tenada' }}>VIBE CHECK</Text>
                <Text className="text-white/20 text-[10px] mt-2 font-black uppercase tracking-[3px]">Identify your primary learning sectors (Top 3)</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="flex-row flex-wrap gap-3 mb-32 px-4 justify-start">
                  {INTERESTS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => toggleInterest(item.id)}
                        activeOpacity={0.8}
                        className={`px-6 py-4 rounded-full border flex-row items-center mb-1 ${isSelected ? 'border-white' : 'border-white/5'}`}
                        style={{ 
                          backgroundColor: isSelected ? item.color : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <item.icon color={isSelected ? 'black' : 'white'} size={18} />
                        <View className="flex-row items-center ml-3">
                           <Text className={`font-black uppercase tracking-widest text-[10px] ${isSelected ? 'text-black' : 'text-white/40'}`}>
                             {item.label}
                           </Text>
                           <View className={`w-1 h-1 rounded-full mx-2 ${isSelected ? 'bg-black/20' : 'bg-white/10'}`} />
                           <Text className={`font-bold text-[14px] ${isSelected ? 'text-black/80' : 'text-white/20'}`}>
                             {item.ko}
                           </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity 
                   disabled={selectedInterests.length === 0}
                   onPress={() => setStep(3)}
                   activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={selectedInterests.length > 0 ? ['#00FFC2', '#00DFB0'] : ['#1A1A1A', '#1A1A1A']}
                    className="h-16 rounded-full items-center justify-center shadow-2xl"
                    style={{ borderRadius: 999 }}
                  >
                    <Text className={`font-black uppercase tracking-widest text-base ${selectedInterests.length > 0 ? 'text-black' : 'text-white/20'}`}>
                      Finalize Identity
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {/* STEP 3: FINALE */}
          {step === 3 && (
            <MotiView 
              key="step3"
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 px-8 justify-center items-center"
            >
              <MotiView 
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                className="bg-[#1A1A1A] border border-white/5 rounded-[48px] p-12 items-center w-full shadow-2xl"
              >
                <View className="w-24 h-24 bg-[#00FFC2]/15 rounded-full items-center justify-center mb-8 border border-[#00FFC2]/20">
                  <CheckCircle2 color="#00FFC2" size={48} />
                </View>
                
                <View className="items-center mb-8 mt-4">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-3xl mr-3">🇰🇷</Text>
                    <Text 
                      numberOfLines={1} 
                      adjustsFontSizeToFit 
                      className="text-white text-5xl" 
                      style={{ fontFamily: 'Tenada' }}
                    >
                      WELCOME
                    </Text>
                  </View>
                  <Text className="text-[#00FFC2] text-xl font-black tracking-[4px]" style={{ fontFamily: 'Tenada' }}>환영합니다</Text>
                </View>

                <View className="items-center mb-10 w-full px-4">
                  <Text className="text-white text-3xl font-black uppercase italic text-center mb-1" numberOfLines={1} adjustsFontSizeToFit>
                    {name}
                  </Text>
                  <Text className="text-[#00FFC2]/60 text-lg font-black tracking-[6px]" style={{ fontFamily: 'Tenada' }}>
                    {name.split(' ').map(n => {
                      const phonemes: string[] = [];
                      const vowelMap: {[key: string]: string} = { 'A': 'ㅏ', 'E': 'ㅔ', 'I': 'ㅣ', 'O': 'ㅗ', 'U': 'ㅜ' };
                      const consMap: {[key: string]: string} = { 
                        'B': 'ㅂ', 'D': 'ㄷ', 'F': 'ㅍ', 'G': 'ㄱ', 'H': 'ㅎ', 
                        'J': 'ㅈ', 'K': 'ㅋ', 'L': 'ㄹ', 'M': 'ㅁ', 'N': 'ㄴ', 
                        'P': 'ㅍ', 'R': 'ㄹ', 'S': 'ㅅ', 'T': 'ㅌ', 'V': 'ㅂ', 
                        'W': 'ㅇ', 'Y': 'ㅇ', 'Z': 'ㅈ' 
                      };

                      n.toUpperCase().split('').forEach((char, idx) => {
                        if (vowelMap[char]) {
                          if (idx === 0 || (idx > 0 && vowelMap[n[idx-1]])) phonemes.push('ㅇ');
                          phonemes.push(vowelMap[char]);
                        } else if (consMap[char]) {
                          phonemes.push(consMap[char]);
                        }
                      });
                      return Hangul.assemble(phonemes);
                    }).join(' ')}
                  </Text>
                </View>

                <View className="bg-black/30 w-full p-8 rounded-[40px] border border-white/5 mb-10">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white/30 font-black uppercase text-[10px]">Proficiency</Text>
                    <Text className="text-[#00FFC2] font-black uppercase tracking-widest">{LEVEL_MAP[correctAnswers as keyof typeof LEVEL_MAP].en}</Text>
                  </View>
                  <View className="flex-row justify-between items-start">
                    <Text className="text-white/30 font-black uppercase text-[10px] mt-1">Ambitions</Text>
                    <View className="items-end gap-y-1">
                      {selectedInterests.map(id => {
                        const interest = INTERESTS.find(i => i.id === id);
                        return (
                          <Text key={id} className="text-white font-black uppercase text-[10px]">
                            {interest?.label} <Text className="text-[#00FFC2]/40">/ {interest?.ko}</Text>
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={finalizeOnboarding}
                  activeOpacity={0.9}
                  className="w-full"
                >
                  <LinearGradient
                    colors={['#00FFC2', '#00DFB0']}
                    className="h-16 rounded-full items-center justify-center shadow-xl"
                    style={{ borderRadius: 999 }}
                  >
                    <Text className="text-black font-black uppercase tracking-widest text-base">Initialize Sync</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </MotiView>
          )}
        </AnimatePresence>
      </SafeAreaView>
    </View>
  );
}
