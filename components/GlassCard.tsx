import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'cyan' | 'mint' | 'rose' | 'default';
}

export default function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  let borderColor = 'rgba(255, 255, 255, 0.1)';
  
  if (variant === 'cyan') borderColor = 'rgba(0, 229, 229, 0.3)';
  if (variant === 'mint') borderColor = 'rgba(0, 255, 194, 0.3)';
  if (variant === 'rose') borderColor = 'rgba(239, 87, 119, 0.3)';

  return (
    <View style={[styles.card, { borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glass effect
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
