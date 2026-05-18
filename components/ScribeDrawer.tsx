import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { X, Eraser, CheckCircle2, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ScribeDrawerProps {
  visible: boolean;
  onClose: () => void;
  char: {
    ko: string;
    en: string;
    name: string;
  } | null;
}

export default function ScribeDrawer({ visible, onClose, char }: ScribeDrawerProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const handleGesture = (event: any) => {
    const { x, y } = event.nativeEvent;
    const point = `${x},${y}`;
    
    if (currentPath === '') {
      setCurrentPath(`M ${point}`);
    } else {
      setCurrentPath((prev) => `${prev} L ${point}`);
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (currentPath !== '') {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!char) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-[#0A0A0A]/95 items-center justify-center">
          <LinearGradient
            colors={['#10111A', '#0A0A0A']}
            className="absolute inset-0"
          />

          {/* Close Header */}
          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="absolute top-12 left-0 right-0 px-8 flex-row justify-between items-center z-50"
          >
            <TouchableOpacity 
              onPress={onClose}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center border border-white/10"
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            <View className="items-end">
                <Text className="text-[#00FFC2] text-[10px] font-black uppercase tracking-[4px] mb-1">District 00</Text>
                <Text className="text-white text-2xl" style={{ fontFamily: 'Tenada' }}>SCRIBE MASTER</Text>
            </View>
          </MotiView>

          {/* Tips Overlay */}
          <View className="absolute top-32 px-8 w-full z-40">
             <View className="bg-[#00FFC2]/5 border border-[#00FFC2]/20 rounded-2xl p-4 flex-row items-center gap-3">
                <Info color="#00FFC2" size={16} />
                <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-4">
                    Carve the character "{char.ko}" following its neural path below.
                </Text>
             </View>
          </View>

          {/* Main Drawing Area */}
          <View className="w-[90%] aspect-square bg-[#1A1A1A] rounded-[48px] border border-white/10 overflow-hidden shadow-2xl">
            {/* Ghost Template */}
            <View className="absolute inset-0 items-center justify-center opacity-5">
              <Text style={{ fontFamily: 'Tenada', fontSize: 240 }} className="text-white">
                {char.ko}
              </Text>
            </View>

            <PanGestureHandler
              onGestureEvent={handleGesture}
              onHandlerStateChange={onHandlerStateChange}
            >
              <View className="flex-1">
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((path, i) => (
                    <Path
                      key={i}
                      d={path}
                      stroke="#00FFC2"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.8}
                    />
                  ))}
                  {currentPath !== '' && (
                    <Path
                      d={currentPath}
                      stroke="#00FFC2"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </View>
            </PanGestureHandler>
          </View>

          {/* Controls Bar */}
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="absolute bottom-16 flex-row gap-4"
          >
            <TouchableOpacity 
              onPress={clearCanvas}
              className="bg-white/5 px-8 py-5 rounded-full border border-white/10 flex-row items-center gap-3"
            >
              <Eraser color="white" size={20} />
              <Text className="text-white font-black uppercase tracking-widest text-[10px]">Purge Canvas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              className="bg-[#00FFC2] px-8 py-5 rounded-full flex-row items-center gap-3 shadow-lg shadow-[#00FFC2]/20"
            >
              <CheckCircle2 color="black" size={20} />
              <Text className="text-black font-black uppercase tracking-widest text-[10px]">Mastered</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
