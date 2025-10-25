import Constants from 'expo-constants';

const EXPO_BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API_BASE_URL = `${EXPO_BACKEND_URL}/api`;

export const api = {
  async getPersonalities() {
    const response = await fetch(`${API_BASE_URL}/personalities`);
    return response.json();
  },

  async createPet(data: any) {
    const response = await fetch(`${API_BASE_URL}/pet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getPet(petId: string) {
    const response = await fetch(`${API_BASE_URL}/pet/${petId}`);
    return response.json();
  },

  async sendChat(petId: string, message: string) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pet_id: petId, message }),
    });
    return response.json();
  },

  async getStats(petId: string) {
    const response = await fetch(`${API_BASE_URL}/stats/${petId}`);
    return response.json();
  },

  async getChatHistory(petId: string, limit = 20) {
    const response = await fetch(`${API_BASE_URL}/chat/history/${petId}?limit=${limit}`);
    return response.json();
  },

  async checkInactive(petId: string) {
    const response = await fetch(`${API_BASE_URL}/check-inactive/${petId}`);
    return response.json();
  },
};