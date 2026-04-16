import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../../types';

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'HOD'|'TEACHER'|'STUDENT'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const { loadDeviceId, setSession } = useAuthStore();

  const handleRegister = async () => {
    setLoading(true);
    const deviceId = await loadDeviceId();
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { role, device_id: deviceId } }
      });
      if (error) throw error;
      
      const { data: profile } = await supabase.from('profiles')
        .select('id, email, role, device_id, face_ref_blob')
        .eq('id', data.user!.id).single();
        
      setSession(profile as UserProfile);
    } catch (e) {
      Alert.alert('Registration Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 p-6">
      <Text className="text-white text-2xl font-bold mb-6">Create Account</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} className="w-full bg-gray-800 text-white p-3 rounded mb-4" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry className="w-full bg-gray-800 text-white p-3 rounded mb-4" />
      <View className="flex-row gap-4 mb-6">
        {(['STUDENT','TEACHER','HOD'] as const).map(r => (
          <TouchableOpacity key={r} onPress={() => setRole(r)} className={`px-3 py-2 rounded ${role === r ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <Text className="text-white">{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={handleRegister} disabled={loading} className="w-full bg-green-600 p-3 rounded">
        <Text className="text-white text-center font-bold">{loading ? 'Creating...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
        <Text className="text-gray-400">Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};