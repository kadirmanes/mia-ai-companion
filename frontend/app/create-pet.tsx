import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePetStore } from '../store/petStore';
import { api } from '../utils/api';
import { useRouter } from 'expo-router';

export default function CreatePet() {
  const router = useRouter();
  const { setPet, setStats } = usePetStore();
  const [name, setName] = useState('');
  const [personalities, setPersonalities] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [customPersonality, setCustomPersonality] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState('#FFB6C1');

  const colors = ['#FFB6C1', '#87CEEB', '#FFD700', '#98FB98', '#DDA0DD'];

  useEffect(() => {
    loadPersonalities();
  }, []);

  const loadPersonalities = async () => {
    try {
      const data = await api.getPersonalities();
      setPersonalities(data.personalities);
    } catch (error) {
      console.error('Error loading personalities:', error);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a name for your AI friend');
      return;
    }

    if (!useCustom && !selectedPersonality) {
      alert('Please select a personality');
      return;
    }

    if (useCustom && !customPersonality.trim()) {
      alert('Please describe your custom personality');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createPet({
        user_id: 'default_user',
        name: name.trim(),
        personality_type: useCustom ? 'custom' : 'predefined',
        personality_id: useCustom ? null : selectedPersonality,
        custom_personality: useCustom ? customPersonality.trim() : null,
        color,
      });

      if (data.success) {
        setPet(data.pet);
        const statsData = await api.getStats(data.pet._id);
        setStats(statsData.stats);
        router.replace('/home');
      }
    } catch (error) {
      console.error('Error creating pet:', error);
      alert('Failed to create your AI friend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#FFE5F0', '#E0E7FF']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create Your AI Friend</Text>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a cute name..."
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Color Theme</Text>
            <View style={styles.colorRow}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    color === c && styles.colorCircleSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Personality Type Toggle */}
          <View style={styles.section}>
            <Text style={styles.label}>Personality</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, !useCustom && styles.toggleButtonActive]}
                onPress={() => setUseCustom(false)}
              >
                <Text style={[styles.toggleText, !useCustom && styles.toggleTextActive]}>
                  Predefined
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, useCustom && styles.toggleButtonActive]}
                onPress={() => setUseCustom(true)}
              >
                <Text style={[styles.toggleText, useCustom && styles.toggleTextActive]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personality Selection */}
          {!useCustom ? (
            <View style={styles.section}>
              {personalities.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.personalityCard,
                    selectedPersonality === p.id && styles.personalityCardSelected,
                  ]}
                  onPress={() => setSelectedPersonality(p.id)}
                >
                  <Text style={styles.personalityEmoji}>{p.emoji}</Text>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>{p.name}</Text>
                    <Text style={styles.personalityDesc}>{p.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.section}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your AI friend's personality...\ne.g., Loves adventure, curious, and always asks thoughtful questions"
                placeholderTextColor="#999"
                value={customPersonality}
                onChangeText={setCustomPersonality}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>
          )}

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF69B4', '#FF1493']}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Create My Friend</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#FF1493',
    transform: [{ scale: 1.1 }],
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FF69B4',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  personalityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personalityCardSelected: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF5FA',
  },
  personalityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  personalityDesc: {
    fontSize: 14,
    color: '#666',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});