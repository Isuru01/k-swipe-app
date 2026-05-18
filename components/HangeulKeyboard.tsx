import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import * as Hangul from 'hangul-js';

const { width } = Dimensions.get('window');

// Prioritized Korean Jamo (Essential ones first)
const ALL_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ', 'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ'];
const ALL_VOWELS = ['ㅏ', 'ㅣ', 'ㅗ', 'ㅓ', 'ㅜ', 'ㅡ', 'ㅐ', 'ㅔ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅒ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];

interface HangeulKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  targetWord?: string;
  disabled?: boolean;
}

export default function HangeulKeyboard({
  onKeyPress,
  onBackspace,
  onSubmit,
  targetWord = '',
  disabled = false,
}: HangeulKeyboardProps) {
  
  // Generate a dynamic set of keys that MUST include the required ones
  const keyboardRows = useMemo(() => {
    // 1. Get required jamos for current word
    const requiredJamos = new Set(Hangul.d(targetWord.normalize('NFC')));
    
    const reqConsonants = Array.from(requiredJamos).filter(j => ALL_CONSONANTS.includes(j));
    const reqVowels = Array.from(requiredJamos).filter(j => ALL_VOWELS.includes(j));
    
    // 3. Helper to fill rows with distractors (prioritizes essential letters)
    const fillDistractors = (current: string[], priorityList: string[], total: number) => {
      const result = [...current];
      // Add from priority list if not already present
      for (const char of priorityList) {
        if (result.length >= total) break;
        if (!result.includes(char)) result.push(char);
      }
      // Final shuffle for game feel
      return result.sort(() => (current.includes(result[0]) ? 0 : Math.random() - 0.5));
    };

    const row1Final = fillDistractors(reqConsonants.slice(0, 10), ALL_CONSONANTS, 10);
    const row2Final = fillDistractors(reqVowels.slice(0, 9), ALL_VOWELS, 9);
    
    const leftovers = [...reqConsonants.slice(10), ...reqVowels.slice(9)];
    const row3Final = fillDistractors(leftovers, [...ALL_CONSONANTS.slice(10), ...ALL_VOWELS.slice(9)], 7);

    return [row1Final, row2Final, row3Final];
  }, [targetWord]);

  return (
    <View className="w-full p-4 pb-10 bg-black/40 border-t border-white/10 shadow-2xl">
      {keyboardRows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row justify-center mb-2.5 gap-1.5 px-0.5">
          {rowIndex === 2 && (
            <TouchableOpacity 
              className="bg-[#EF5777]/20 border border-[#EF5777]/30 rounded-xl px-3 justify-center items-center min-w-[55px]"
              onPress={onBackspace}
              disabled={disabled}
            >
              <Text className="text-[#EF5777] text-xl font-bold">⌫</Text>
            </TouchableOpacity>
          )}

          {row.map((key) => (
            <TouchableOpacity
              key={key}
              className={`bg-white/10 border border-white/10 rounded-xl py-3.5 flex-1 max-w-[42px] justify-center items-center ${disabled ? 'opacity-50' : ''}`}
              onPress={() => onKeyPress(key)}
              disabled={disabled}
            >
              <Text className="text-white text-lg font-black" style={{ fontFamily: 'Tenada' }}>{key}</Text>
            </TouchableOpacity>
          ))}

          {rowIndex === 2 && (
            <TouchableOpacity 
              className="bg-[#00FFC2] border border-[#00FFC2]/50 rounded-xl px-3 justify-center items-center min-w-[65px]"
              onPress={onSubmit}
              disabled={disabled}
            >
              <Text className="text-black font-black text-xs uppercase" style={{ fontFamily: 'Tenada' }}>입력</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}
