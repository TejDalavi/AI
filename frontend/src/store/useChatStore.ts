import { create } from 'zustand';
import api from '../lib/api';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
}

interface ChatState {
  chats: Chat[];
  currentChatId: number | null;
  messages: Message[];
  isSending: boolean;
  isLoading: boolean;
  error: string | null;

  fetchChats: () => Promise<void>;
  setCurrentChat: (id: number | null) => void;
  fetchMessages: (chatId: number) => Promise<void>;
  createChat: () => Promise<number>;
  sendMessage: (chatId: number, content: string) => Promise<void>;
  deleteChat: (chatId: number) => Promise<void>;
  renameChat: (chatId: number, title: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  isSending: false,
  isLoading: false,
  error: null,

  fetchChats: async () => {
    try {
      const response = await api.get('/chats/');
      set({ chats: response.data, error: null });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message });
    }
  },

  setCurrentChat: (id) => {
    set({ currentChatId: id, messages: [] });
    if (id) {
      get().fetchMessages(id);
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      set({ messages: response.data, isLoading: false, error: null });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
    }
  },

  createChat: async () => {
    try {
      const response = await api.post('/chats/', { title: 'New Chat' });
      const newChat = response.data;
      set((state) => ({ chats: [newChat, ...state.chats], error: null }));
      return newChat.id;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message });
      throw err;
    }
  },

  sendMessage: async (chatId, content) => {
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempMessage],
      isSending: true,
      error: null,
    }));

    try {
      await api.post(`/chats/${chatId}/send`, { content });

      const [messagesResponse, chatsResponse] = await Promise.all([
        api.get(`/chats/${chatId}/messages`),
        api.get('/chats/'),
      ]);

      set({
        messages: messagesResponse.data,
        chats: chatsResponse.data,
        isSending: false,
        error: null,
      });
    } catch (err: any) {
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== tempId),
        isSending: false,
        error: err.response?.data?.detail || err.message,
      }));
      throw err;
    }
  },

  deleteChat: async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`);
      set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
        currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        messages: state.currentChatId === chatId ? [] : state.messages,
        error: null,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message });
      throw err;
    }
  },

  renameChat: async (chatId, title) => {
    try {
      const response = await api.patch(`/chats/${chatId}/rename`, { title });
      set((state) => ({
        chats: state.chats.map((chat) => (
          chat.id === chatId ? { ...chat, title: response.data.title } : chat
        )),
        error: null,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message });
      throw err;
    }
  },
}));
