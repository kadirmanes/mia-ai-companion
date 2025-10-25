import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Pet {
  _id: string;
  name: string;
  personality_type: string;
  personality_id?: string;
  custom_personality?: string;
  color: string;
  level: number;
  created_at: string;
  last_interaction: string;
}

interface Stats {
  _id?: string;
  pet_id: string;
  affection: number;
  hunger: number;
  energy: number;
  mood: string;
  updated_at: string;
}

interface PetState {
  pet: Pet | null;
  stats: Stats | null;
  isLoading: boolean;
  setPet: (pet: Pet) => void;
  setStats: (stats: Stats) => void;
  setLoading: (loading: boolean) => void;
  clearPet: () => void;
}

export const usePetStore = create<PetState>((set) => ({
  pet: null,
  stats: null,
  isLoading: false,
  setPet: (pet) => {
    set({ pet });
    AsyncStorage.setItem('current_pet_id', pet._id);
  },
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearPet: () => {
    set({ pet: null, stats: null });
    AsyncStorage.removeItem('current_pet_id');
  },
}));