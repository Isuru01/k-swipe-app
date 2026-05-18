import { Stack, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Volume2, Sparkles, BookOpen, PenTool } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import ScribeDrawer from '../components/ScribeDrawer';

const { width } = Dimensions.get('window');

const CONSONANTS = [
  { ko: 'ㄱ', en: 'g/k', name: 'Giyeok' },
  { ko: 'ㄴ', en: 'n', name: 'Nieun' },
  { ko: 'ㄷ', en: 'd/t', name: 'Digeut' },
  { ko: 'ㄹ', en: 'r/l', name: 'Rieul' },
  { ko: 'ㅁ', en: 'm', name: 'Mieum' },
  { ko: 'ㅂ', en: 'b/p', name: 'Bieup' },
  { ko: 'ㅅ', en: 's', name: 'Siot' },
  { ko: 'ㅇ', en: 'ng', name: 'Ieung' },
  { ko: 'ㅈ', en: 'j', name: 'Jieut' },
  { ko: 'ㅊ', en: 'ch', name: 'Chieut' },
  { ko: 'ㅋ', en: 'k', name: 'Kieuk' },
  { ko: 'ㅌ', en: 't', name: 'Tieut' },
  { ko: 'ㅍ', en: 'p', name: 'Pieup' },
  { ko: 'ㅎ', en: 'h', name: 'Hieut' },
];

const VOWELS = [
  { ko: 'ㅏ', en: 'a', name: 'A' },
  { ko: 'ㅑ', en: 'ya', name: 'Ya' },
  { ko: 'ㅓ', en: 'eo', name: 'Eo' },
  { ko: 'ㅕ', en: 'yeo', name: 'Yeo' },
  { ko: 'ㅗ', en: 'o', name: 'O' },
  { ko: 'ㅛ', en: 'yo', name: 'Yo' },
  { ko: 'ㅜ', en: 'u', name: 'U' },
  { ko: 'ㅠ', en: 'yu', name: 'Yu' },
  { ko: 'ㅡ', en: 'eu', name: 'Eu' },
  { ko: 'ㅣ', en: 'i', name: 'I' },
];

export default function ForgeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'consonants' | 'vowels'>('consonants');
  const [selectedChar, setSelectedChar] = useState<any>(null);
  const [isScribeOpen, setIsScribeOpen] = useState(false);

  const speak = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Explicit stop then slight delay for reliability
    Speech.stop().then(() => {
        setTimeout(() => {
            Speech.speak(text, { language: 'ko', rate: 0.8 });
        }, 100);
    });
  };

  const currentList = tab === 'consonants' ? CONSONANTS : VOWELS;

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#10111A', '#0A0A0A']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-8 pt-6 flex-row justify-between items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full bg-white/5 items-center justify-center border border-white/10"
          >
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <View className="items-end">
            <Text className="text-[#00FFC2] text-[10px] font-black uppercase tracking-[4px] mb-1">District 00</Text>
            <Text className="text-white text-3xl" style={{ fontFamily: 'Tenada' }}>THE FORGE</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="px-8 mb-8">
          <View className="flex-row bg-white/5 rounded-full p-2 border border-white/10">
            <TouchableOpacity 
              onPress={() => {
                setTab('consonants');
                setSelectedChar(null);
                Haptics.selectionAsync();
              }}
              className={`flex-1 py-4 rounded-full items-center ${tab === 'consonants' ? 'bg-[#00FFC2]' : ''}`}
            >
              <Text className={`font-black uppercase tracking-widest text-[10px] ${tab === 'consonants' ? 'text-black' : 'text-white/40'}`}>Consonants</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setTab('vowels');
                setSelectedChar(null);
                Haptics.selectionAsync();
              }}
              className={`flex-1 py-4 rounded-full items-center ${tab === 'vowels' ? 'bg-[#00FFC2]' : ''}`}
            >
              <Text className={`font-black uppercase tracking-widest text-[10px] ${tab === 'vowels' ? 'text-black' : 'text-white/40'}`}>Vowels</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Character Grid */}
          <MotiView 
            animate={{ opacity: 1 }}
            from={{ opacity: 0 }}
            className="flex-row flex-wrap justify-between"
          >
            {currentList.map((item, index) => (
              <TouchableOpacity
                key={item.ko}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedChar(item);
                  speak(item.ko);
                }}
                className={`mb-4 rounded-[24px] border ${selectedChar?.ko === item.ko ? 'bg-[#00FFC2]/10 border-[#00FFC2]' : 'bg-white/5 border-white/10'}`}
                style={{ width: (width - 64) / 3 }}
              >
                <View className="aspect-square items-center justify-center p-4">
                  <Text className={`text-5xl mb-2 ${selectedChar?.ko === item.ko ? 'text-[#00FFC2]' : 'text-white'}`} style={{ fontFamily: 'Tenada' }}>
                    {item.ko}
                  </Text>
                  <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">{item.en}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </MotiView>

          {/* Character Detail / Blueprint */}
          <AnimatePresence>
            {selectedChar && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 20 }}
                className="mt-8 bg-white/5 border border-white/10 rounded-[40px] p-8"
              >
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-[#00FFC2] text-[10px] font-black uppercase tracking-[4px] mb-2">Neural Blueprint</Text>
                    <Text className="text-white text-4xl font-black">{selectedChar.name}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => speak(selectedChar.ko)}
                    className="w-16 h-16 rounded-full bg-[#00FFC2]/20 items-center justify-center border border-[#00FFC2]/40"
                  >
                    <Volume2 color="#00FFC2" size={32} />
                  </TouchableOpacity>
                </View>
                
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-black/40 p-6 rounded-[24px] border border-white/5">
                    <Text className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-2">Phonetic</Text>
                    <Text className="text-[#00FFC2] text-2xl font-black">{selectedChar.en}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setIsScribeOpen(true);
                    }}
                    className="flex-1 bg-[#00FFC2]/10 p-6 rounded-[24px] border border-[#00FFC2]/30 items-center justify-center flex-row gap-3"
                  >
                     <PenTool color="#00FFC2" size={18} />
                     <View>
                        <Text className="text-[#00FFC2] text-[9px] font-black uppercase tracking-widest">Scribe Mode</Text>
                        <Text className="text-white text-xs font-bold uppercase">Trace & Master</Text>
                     </View>
                  </TouchableOpacity>
                </View>

                <View className="mt-6 bg-[#00FFC2]/5 p-6 rounded-[24px] border border-[#00FFC2]/10 flex-row items-center gap-4">
                   <Sparkles color="#00FFC2" size={20} />
                   <View className="flex-1">
                     <Text className="text-white/60 text-xs leading-5">
                      Master this character by repeating the sound and mimicking its shape in your mind's eye.
                     </Text>
                   </View>
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Quick Practice CTA */}
          {!selectedChar && (
            <MotiView 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 500 }}
              className="mt-12 items-center"
            >
              <BookOpen color="rgba(255,255,255,0.1)" size={48} />
              <Text className="text-white/20 text-[10px] font-black uppercase tracking-[6px] mt-6 text-center px-12">
                Select a character from the circuit above to initialize the blueprint
              </Text>
            </MotiView>
          )}
        </ScrollView>
      </SafeAreaView>

      <ScribeDrawer 
        visible={isScribeOpen} 
        onClose={() => setIsScribeOpen(false)} 
        char={selectedChar} 
      />
    </View>
  );
}

function CheckCircle({ state }: { state: 'locked' | 'unlocked' }) {
  return (
    <View className={`w-3 h-3 rounded-full ${state === 'unlocked' ? 'bg-[#00FFC2]' : 'bg-white/10'}`} />
  );
}
