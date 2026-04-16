import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';


export default function App() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
       supabase.from('profiles').select('id, email, role, is_verified, phone, device_id, face_ref_blob').eq('id', session.user.id).single().then(({ data, error }) => {
          if (data) {
            setSession(data as any);
          } else {
            console.error('Error fetching profile:', error);
            setLoading(false);
          }
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}