import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setSession: (user: UserProfile) => void;
  logout: () => Promise<void>;
  loadDeviceId: () => Promise<string>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setSession: (user) => set({ user, loading: false }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, loading: false });
      },
      loadDeviceId: async () => {
        let id = await SecureStore.getItemAsync('DEVICE_ID');
        if (!id) {
          id = crypto.randomUUID();
          await SecureStore.setItemAsync('DEVICE_ID', id);
        }
        return id;
      },
    }),
    { name: 'attendauth-auth', storage: createJSONStorage(() => SecureStore) }
  )
);