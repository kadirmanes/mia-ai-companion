import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePetStore } from '../store/petStore';
import { api } from '../utils/api';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';

export default function Index() {
  const router = useRouter();
  const { setPet, setStats, setLoading } = usePetStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingPet();
  }, []);

  const checkExistingPet = async () => {
    try {
      const petId = await AsyncStorage.getItem('current_pet_id');
      if (petId) {
        const data = await api.getPet(petId);
        if (data.pet) {
          setPet(data.pet);
          setStats(data.stats);
          router.replace('/home');
        }
      }
    } catch (error) {
      console.error('Error checking pet:', error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFE5F0', '#E0E7FF', '#F0E5FF']}
      style={styles.container}
    >
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.content}>
        <Text style={styles.title}>MIA</Text>
        <Text style={styles.subtitle}>My Intelligent Avatar</Text>
        <Text style={styles.emoji}>✨🐾✨</Text>
        <Text style={styles.description}>
          Create your AI companion{' \n'}
          A friend who learns, grows, and remembers you
        </Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={1000} delay={300} style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/create-pet')}
        >
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Create Your AI Friend</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5F0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FF1493',
    textShadowColor: 'rgba(255, 105, 180, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  emoji: {
    fontSize: 48,
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});