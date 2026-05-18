import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import * as Hangul from 'hangul-js';

interface LinguisticAvatarProps {
  name: string;
  size?: number;
  borderWidth?: number;
}

const COLORS = ['#00FFC2', '#EF5777', '#FFD32A', '#7158e2', '#3ae374', '#18dcff'];

/**
 * Robust phonetic transliteration using hangul-js assembly
 */
function getSyllabicName(name: string): string {
  if (!name || name === 'K-Learner') return 'ㅇ';
  
  const firstName = name.split(' ')[0].toUpperCase();
  const phonemes: string[] = [];
  const vowelMap: {[key: string]: string} = { 'A': 'ㅏ', 'E': 'ㅔ', 'I': 'ㅣ', 'O': 'ㅗ', 'U': 'ㅜ', 'Y': 'ㅣ' };
  const consMap: {[key: string]: string} = { 
    'B': 'ㅂ', 'D': 'ㄷ', 'F': 'ㅍ', 'G': 'ㄱ', 'H': 'ㅎ', 
    'J': 'ㅈ', 'K': 'ㅋ', 'L': 'ㄹ', 'M': 'ㅁ', 'N': 'ㄴ', 
    'P': 'ㅍ', 'R': 'ㄹ', 'S': 'ㅅ', 'T': 'ㅌ', 'V': 'ㅂ', 
    'W': 'ㅇ', 'Y': 'ㅇ', 'Z': 'ㅈ' 
  };

  firstName.split('').forEach((char, idx) => {
    if (vowelMap[char]) {
      // Add silent 'ㅇ' if vowel starts the syllable
      if (idx === 0 || (idx > 0 && vowelMap[firstName[idx-1]])) phonemes.push('ㅇ');
      phonemes.push(vowelMap[char]);
    } else if (consMap[char]) {
      phonemes.push(consMap[char]);
    }
  });

  const assembled = Hangul.assemble(phonemes);
  // Return first 2 syllables for optimal avatar fit
  return assembled.substring(0, 2);
}

export default function LinguisticAvatar({ name, size = 48, borderWidth = 2 }: LinguisticAvatarProps) {
  const hangeulAlias = useMemo(() => {
    if (name.toLowerCase() === 'isuru') return '이수';
    return getSyllabicName(name);
  }, [name]);

  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = COLORS[charCode % COLORS.length];

  return (
    <MotiView
      from={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="items-center justify-center overflow-hidden"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        borderWidth: borderWidth,
      }}
    >
      <View 
        className="items-center justify-center"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      >
        <Text 
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ 
            fontFamily: 'Tenada', 
            fontSize: size * 0.35, 
            color: '#000',
            fontWeight: '900',
            textAlign: 'center',
            paddingHorizontal: 2
          }}
        >
          {hangeulAlias}
        </Text>
      </View>
      
      {/* Premium Glass Reflection */}
      <View 
        className="absolute w-full h-[40%] top-0 left-0"
        style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderBottomLeftRadius: size / 2,
          borderBottomRightRadius: size / 2,
        }}
      />
    </MotiView>
  );
}
