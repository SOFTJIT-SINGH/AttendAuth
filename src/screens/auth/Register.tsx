import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

type Role = 'HOD' | 'TEACHER' | 'STUDENT';

const ROLES: { label: string; value: Role; icon: any; color: string }[] = [
  { label: 'Student', value: 'STUDENT', icon: 'school-outline', color: '#6366f1' },
  { label: 'Teacher', value: 'TEACHER', icon: 'person-outline', color: '#f59e0b' },
  { label: 'HoD', value: 'HOD', icon: 'briefcase-outline', color: '#06b6d4' },
];

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loadDeviceId } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    const deviceId = await loadDeviceId();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role, device_id: deviceId, phone } },
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Success', 'Verification code sent.');
        navigation.navigate('Otp', { email: email.trim() });
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute top-[-10%] right-[-20%] w-[130%] h-[60%] rounded-full opacity-20">
        <LinearGradient colors={['#6366f1', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8 py-10" keyboardShouldPersistTaps="handled">
          <View className="mb-8 mt-6">
            <Text className="text-white text-4xl font-black">Register</Text>
          </View>

          <View className="bg-white/5 rounded-[40px] p-8 border border-white/10">
            <View className="space-y-4 gap-4">
              {/* Phone Field */}
              <View className="bg-white/5 border border-white/10 rounded-3xl flex-row items-center px-5 py-4">
                <Ionicons name="call-outline" size={18} color="#6366f1" className="mr-4" />
                <TextInput 
                  placeholder="Phone" placeholderTextColor="#64748b" 
                  value={phone} onChangeText={setPhone} keyboardType="phone-pad"
                  style={{ color: '#ffffff' }} className="flex-1 font-medium"
                />
              </View>

              {/* Email Field */}
              <View className="bg-white/5 border border-white/10 rounded-3xl flex-row items-center px-5 py-4">
                <Ionicons name="mail-outline" size={18} color="#6366f1" className="mr-4" />
                <TextInput 
                  placeholder="Email" placeholderTextColor="#64748b" 
                  value={email} onChangeText={setEmail} autoCapitalize="none"
                  style={{ color: '#ffffff' }} className="flex-1 font-medium"
                />
              </View>

              {/* Password Field */}
              <View className="bg-white/5 border border-white/10 rounded-3xl flex-row items-center px-5 py-4">
                <Ionicons name="lock-closed-outline" size={18} color="#6366f1" className="mr-4" />
                <TextInput 
                  placeholder="Password" placeholderTextColor="#64748b" 
                  value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                  style={{ color: '#ffffff' }} className="flex-1 font-medium"
                />
              </View>
            </View>

            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-8 mb-4 px-2">Role</Text>
            <View className="flex-row space-x-3 gap-3 mb-10">
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value} onPress={() => setRole(r.value)}
                  style={{ 
                    backgroundColor: role === r.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0)',
                    borderColor: role === r.value ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)'
                  }}
                  className="flex-1 items-center py-4 rounded-3xl border"
                >
                  <View className="w-8 h-8 rounded-xl items-center justify-center mb-1">
                    <Ionicons name={r.icon} size={18} color={role === r.value ? r.color : '#4b5563'} />
                  </View>
                  <Text style={{ color: role === r.value ? '#fff' : '#6b7280' }} className="text-[10px] font-black uppercase tracking-tighter">{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9}>
              <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 rounded-3xl items-center shadow-2xl">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-lg uppercase tracking-widest">Register</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-8 self-center">
              <Text className="text-gray-500 font-medium underline">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};