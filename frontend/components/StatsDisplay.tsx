import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsDisplayProps {
  affection: number;
  hunger: number;
  energy: number;
}

export default function StatsDisplay({ affection, hunger, energy }: StatsDisplayProps) {
  const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={styles.statContainer}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statValue}>{value}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatBar label="💖 Affection" value={affection} color="#FF69B4" />
      <StatBar label="🍔 Hunger" value={100 - hunger} color="#FFA500" />
      <StatBar label="⚡ Energy" value={energy} color="#4169E1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContainer: {
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  barBackground: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  statValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
});