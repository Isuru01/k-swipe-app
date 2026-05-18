import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Music, Utensils, MessageCircle, Heart, Star, Compass, Coffee, MapPin, SignpostBig } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SUBJECTS = [
  { id: 'Greetings', label: 'Greetings', hangeul: '인사', icon: MessageCircle, color: '#00E5E5' },
  { id: 'Daily', label: 'Daily', hangeul: '일상', icon: Coffee, color: '#FFA500' },
  { id: 'Social', label: 'Social', hangeul: '사회', icon: Star, color: '#9dff00' },
  { id: 'Food', label: 'Food', hangeul: '음식', icon: Utensils, color: '#FF4757' },
  { id: 'Slangs', label: 'Slangs', hangeul: '속어', icon: Zap, color: '#7158e2' },
  { id: 'K-Pop', label: 'K-Pop', hangeul: '가요', icon: Music, color: '#FF1493' },
  { id: 'K-Drama', label: 'K-Drama', hangeul: '드라마', icon: Compass, color: '#00D2D3' },
  { id: 'Dating', label: 'Dating', hangeul: '연애', icon: Heart, color: '#EF5777' },
  { id: 'Cities', label: 'Cities', hangeul: '도시', icon: MapPin, color: '#FFD700' },
  { id: 'Signs', label: 'Signs', hangeul: '표지판', icon: SignpostBig, color: '#00FFC2' },
];

export default function DeckScreen() {
  const router = useRouter();

  const startPractice = (categoryId: string) => {
    router.push({
      pathname: '/game',
      params: { category: categoryId }
    });
  };

  return (
    <View className="flex-1 bg-[#477579]">
      <LinearGradient
        colors={['#477579', '#8D9C70', '#273C43']}
        className="absolute inset-0"
      />
      
      <SafeAreaView className="flex-1">
        <View className="px-8 pt-8 pb-8">
          <Text className="text-white/30 text-[10px] font-black uppercase tracking-[8px] mb-1">District Registry</Text>
          <Text className="text-white text-5xl" style={{ fontFamily: 'Tenada' }}>VOCAB HUB</Text>
        </View>

        <ScrollView 
          className="flex-1 px-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 6 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {SUBJECTS.map((subject, index) => (
              <MotiView
                key={subject.id}
                from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ delay: index * 40, type: 'spring' }}
                style={{ width: (width - 60) / 2 }}
                className="mb-8 aspect-square"
              >
                <TouchableOpacity
                  onPress={() => startPractice(subject.id)}
                  activeOpacity={0.85}
                  className="flex-1"
                >
                  {/* Clean Glass Card with Unified Border */}
                  <View 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    className="flex-1 rounded-2xl border border-white/30 p-5 justify-between"
                  >
                    <View className="flex-row justify-between items-start">
                      <View 
                        style={{ backgroundColor: `${subject.color}25` }}
                        className="w-11 h-11 rounded-xl items-center justify-center border border-white/10"
                      >
                        <subject.icon color={subject.color} size={22} />
                      </View>
                      
                      <Text 
                        style={{ fontFamily: 'Tenada' }} 
                        className="text-white/40 text-[10px]"
                      >
                        {subject.hangeul}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-white text-lg font-black uppercase tracking-widest leading-none mb-1">
                        {subject.label}
                      </Text>
                      <View className="w-10 h-0.5" style={{ backgroundColor: subject.color }} />
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
