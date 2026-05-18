import React, { useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeCardProps {
  hangeul: string;
  romanization: string;
  meaning: string;
  category?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onPlaySound?: () => void;
}

export default function SwipeCard({
  hangeul,
  romanization,
  meaning,
  category = 'VIBE',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Auto-play pronunciation whenever a new card mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      Speech.stop();
      Speech.speak(hangeul, { language: 'ko', rate: 0.85, pitch: 1.0 });
    }, 300); // small delay to let card animation settle
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [hangeul]);

  const playSound = () => {
    Speech.stop();
    Speech.speak(hangeul, { language: 'ko', rate: 0.85, pitch: 1.0 });
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5);
        if (direction === 1 && onSwipeRight) runOnJS(onSwipeRight)();
        if (direction === -1 && onSwipeLeft) runOnJS(onSwipeLeft)();
      } else if (event.translationY < -SWIPE_THRESHOLD) {
        translateY.value = withSpring(-SCREEN_WIDTH * 1.5);
        if (onSwipeUp) runOnJS(onSwipeUp)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.2, 1]
    );

    const baseColor = translateX.value > 0 ? '#00FFC2' : (translateX.value < 0 ? '#EF5777' : '#FFFFFF');

    return {
      borderColor: translateX.value > 0 ? '#00FFC2' : (translateX.value < 0 ? '#EF5777' : 'rgba(255,255,255,0.2)'),
      shadowColor: baseColor,
      borderWidth: interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [1, 4]),
      shadowOpacity: opacity,
      shadowRadius: interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [10, 30]),
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    };
  });

  const indicatorRightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const indicatorLeftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
  }));

  return (
    <View className="flex-1 justify-center items-center py-4 w-full">
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[animatedStyle, glowStyle]}
          className="w-[92vw] h-[64vh] rounded-[48px] border border-white/5 justify-center items-center overflow-hidden shadow-2xl"
        >
          {/* Neon Top Bar */}
          <View className="absolute top-0 left-0 right-0 h-1 bg-accent/30" />
          
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex-1 w-full items-center p-6 pt-10"
          >
            {/* Category Marker */}
            <View className={`mb-4 px-4 py-1.5 rounded-full border ${category === 'Alphabet' ? 'bg-[#00FFC2]/20 border-[#00FFC2]/30' : 'bg-[#EF5777]/20 border-[#EF5777]/30'}`}>
              <Text className={`${category === 'Alphabet' ? 'text-[#00FFC2]' : 'text-[#EF5777]'} text-[10px] font-black uppercase tracking-[4px]`}>{category}</Text>
            </View>

            <View 
              className="items-center mb-4 w-full justify-center" 
              style={{ minHeight: 130 }}
            >
              <Text 
                className="text-white text-center" 
                style={{ 
                  fontFamily: hangeul.length === 1 ? 'System' : 'Tenada', 
                  fontSize: hangeul.length === 1 ? 100 : 64,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0, 255, 194, 0.4)', 
                  textShadowRadius: 25,
                }}
              >
                {hangeul}
              </Text>
            </View>

            <View className="bg-black/20 px-8 py-2 rounded-full border border-white/10 mb-4">
              <Text className="text-white/40 text-[10px] font-bold tracking-[6px] uppercase">
                {romanization}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={playSound}
              className="bg-accent/10 p-4 rounded-full border border-accent/20 mb-4 shadow-lg shadow-accent/20"
              activeOpacity={0.7}
            >
              <Volume2 size={24} color="#00FFC2" />
            </TouchableOpacity>

            <View className="w-1/4 h-[1px] bg-white/10 mb-4" />

            <View className="items-center px-4 pb-2">
              <Text className="text-white/30 text-[10px] uppercase tracking-[6px] font-bold mb-1">Translation</Text>
              <Text 
                className="text-white text-3xl font-black text-center tracking-tight leading-tight"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {meaning}
              </Text>
            </View>
          </MotiView>

          {/* Side Indicator Overlays */}
          <Animated.View 
            style={[indicatorRightStyle]}
            className="absolute right-6 top-1/2 -translate-y-1/2"
          >
            <View className="w-12 h-12 rounded-full bg-success/20 items-center justify-center border border-success">
              <Text className="text-success text-2xl">✓</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[indicatorLeftStyle]}
            className="absolute left-6 top-1/2 -translate-y-1/2"
          >
            <View className="w-12 h-12 rounded-full bg-error/20 items-center justify-center border border-error">
              <Text className="text-error text-2xl">✕</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
