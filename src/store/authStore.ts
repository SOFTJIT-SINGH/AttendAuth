import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setSession: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  loadDeviceId: () => Promise<string>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setSession: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, loading: false });
      },
      loadDeviceId: async () => {
        let id = await SecureStore.getItemAsync('DEVICE_ID');
        if (!id) {
          id =
            (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
          await SecureStore.setItemAsync('DEVICE_ID', id);
        }
        return id;
      },
    }),
{
      name: 'attendauth-auth',
      storage: createJSONStorage(() => ({
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      })),
      partialize: (state) => ({ 
        user: state.user ? { ...state.user, face_ref_blob: null } : null 
      }),
    }  )
);
