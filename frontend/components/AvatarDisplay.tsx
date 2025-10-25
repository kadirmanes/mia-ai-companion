import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarDisplayProps {
  emotion: string;
  color: string;
  name: string;
}

const emotionConfig: Record<string, { emoji: string; colors: string[]; animation: any }> = {
  happy: { emoji: '😊', colors: ['#FFD700', '#FFA500'], animation: 'bounce' },
  content: { emoji: '😌', colors: ['#87CEEB', '#4682B4'], animation: 'pulse' },
  neutral: { emoji: '😐', colors: ['#D3D3D3', '#A9A9A9'], animation: 'fadeIn' },
  sad: { emoji: '😢', colors: ['#4682B4', '#1E3A8A'], animation: 'fadeIn' },
  very_sad: { emoji: '😭', colors: ['#1E3A8A', '#0F172A'], animation: 'shake' },
};

export default function AvatarDisplay({ emotion, color, name }: AvatarDisplayProps) {
  const config = emotionConfig[emotion] || emotionConfig.neutral;

  return (
    <Animatable.View
      animation={config.animation}
      iterationCount="infinite"
      duration={2000}
      style={styles.container}
    >
      <LinearGradient
        colors={config.colors}
        style={styles.avatarCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.emoji}>{config.emoji}</Text>
      </LinearGradient>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.emotion}>{emotion.replace('_', ' ')}</Text>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatarCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emoji: {
    fontSize: 80,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emotion: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
});