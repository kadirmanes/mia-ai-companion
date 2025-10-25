import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePetStore } from '../store/petStore';
import { api } from '../utils/api';
import AvatarDisplay from '../components/AvatarDisplay';
import StatsDisplay from '../components/StatsDisplay';
import * as Animatable from 'react-native-animatable';

interface Message {
  role: 'user' | 'ai';
  content: string;
  emotion?: string;
}

export default function Home() {
  const { pet, stats, setStats } = usePetStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (pet) {
      loadChatHistory();
      checkInactivity();
    }
  }, [pet]);

  useEffect(() => {
    if (stats) {
      setCurrentEmotion(stats.mood);
    }
  }, [stats]);

  const loadChatHistory = async () => {
    if (!pet) return;
    try {
      const data = await api.getChatHistory(pet._id, 10);
      const history: Message[] = [];
      data.chats.forEach((chat: any) => {
        history.push({ role: 'user', content: chat.user_message });
        history.push({
          role: 'ai',
          content: chat.ai_response,
          emotion: chat.emotion,
        });
      });
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const checkInactivity = async () => {
    if (!pet) return;
    try {
      const data = await api.checkInactive(pet._id);
      if (data.inactive) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: data.message, emotion: 'sad' },
        ]);
      }
    } catch (error) {
      console.error('Error checking inactivity:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !pet) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await api.sendChat(pet._id, userMessage);
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: data.response, emotion: data.emotion },
        ]);
        setCurrentEmotion(data.emotion);

        // Refresh stats
        const statsData = await api.getStats(pet._id);
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: "Sorry, I couldn't respond. Please try again.", emotion: 'sad' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!pet || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#FFE5F0', '#E0E7FF']} style={styles.gradient}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <AvatarDisplay
            emotion={currentEmotion}
            color={pet.color}
            name={pet.name}
          />
        </View>

        {/* Stats */}
        <StatsDisplay
          affection={stats.affection}
          hunger={stats.hunger}
          energy={stats.energy}
        />

        {/* Chat Area */}
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Animatable.View animation="fadeIn" style={styles.welcomeMessage}>
                <Text style={styles.welcomeText}>
                  Hi! I'm {pet.name}. Talk to me and let's be friends! 💕
                </Text>
              </Animatable.View>
            )}
            {messages.map((msg, index) => (
              <Animatable.View
                key={index}
                animation="fadeInUp"
                duration={500}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {msg.content}
                </Text>
              </Animatable.View>
            ))}
            {loading && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Talk to ${pet.name}...`}
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || loading}
          >
            <LinearGradient
              colors={message.trim() ? ['#FF69B4', '#FF1493'] : ['#DDD', '#CCC']}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5F0',
  },
  header: {
    paddingTop: 40,
  },
  chatContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  welcomeMessage: {
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF69B4',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  aiText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});