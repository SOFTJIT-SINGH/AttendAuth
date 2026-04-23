import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';

export default function App() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);
      
      if (session?.user) {
        setLoading(true);
        try {
          // Attempt to fetch profile details
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (data) {
            setSession(data as any);
          } else {
            // Fallback to session metadata if DB is unreachable
            const meta = session.user.user_metadata || {};
            setSession({
              id: session.user.id,
              email: session.user.email || '',
              full_name: meta.full_name || 'User',
              role: meta.role || 'STUDENT',
              is_verified: meta.role === 'HOD' || false, // Do not auto-verify students
              phone: meta.phone || null,
              device_id: meta.device_id || null,
              face_ref_blob: null,
            } as any);
          }
        } catch (e) {
          console.warn('[Sync] Profile fetch failed, using minimal session.');
          setLoading(false);
        } finally {
          setLoading(false);
        }
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}