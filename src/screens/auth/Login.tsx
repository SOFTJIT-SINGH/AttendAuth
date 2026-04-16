import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../../types';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role, device_id, face_ref_blob')
        .eq('id', data.user!.id)
        .single();
        
      setSession(profile as UserProfile);
    } catch (e) {
      Alert.alert('Login Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 p-6">
      <Text className="text-white text-2xl font-bold mb-8">AttendAuth Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} className="w-full bg-gray-800 text-white p-3 rounded mb-4" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry className="w-full bg-gray-800 text-white p-3 rounded mb-6" />
      <TouchableOpacity onPress={handleLogin} disabled={loading} className="w-full bg-blue-600 p-3 rounded">
        <Text className="text-white text-center font-bold">{loading ? 'Signing In...' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')} className="mt-4">
        <Text className="text-blue-400">Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};