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
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // 1. Explicitly check session on startup to catch corrupted state
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth Init] Session error:', error.message);
          // If token is missing/invalid, force a clean state
          if (error.message.includes('Refresh Token') || error.message.includes('invalid')) {
            await supabase.auth.signOut();
            setSession(null);
          }
        } else if (session?.user) {
          await handleUserSync(session);
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error('[Auth Init] Critical error:', err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    const handleUserSync = async (session: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setSession(data as any);
        } else {
          const meta = session.user.user_metadata || {};
          setSession({
            id: session.user.id,
            email: session.user.email || '',
            full_name: meta.full_name || 'User',
            role: meta.role || 'STUDENT',
            is_verified: meta.role === 'HOD' || false,
            phone: meta.phone || null,
            device_id: meta.device_id || null,
            face_ref_blob: null,
          } as any);
        }
      } catch (e) {
        console.warn('[Sync] Profile fetch failed:', e);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setLoading(true);
        await handleUserSync(session);
        setLoading(false);
      } else if (event !== 'INITIAL_SESSION') { 
        // Avoid double-clearing during initializeAuth
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