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
import { UserProfile } from '../../types';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const { setSession } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role, is_verified, phone, device_id, face_ref_blob')
        .eq('id', data.user!.id)
        .single();

      if (profile) setSession(profile as UserProfile);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Background blobs */}
      <View className="absolute top-[-10%] left-[-20%] w-[150%] h-[70%] rounded-full opacity-30">
        <LinearGradient colors={['#6366f1', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>
      <View className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[60%] rounded-full opacity-20">
        <LinearGradient colors={['#a855f7', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-white/10 rounded-3xl border border-white/20 items-center justify-center shadow-2xl backdrop-blur-3xl">
              <Ionicons name="finger-print" size={42} color="#fff" />
            </View>
            <Text className="text-white text-4xl font-black tracking-tighter mt-6">AttendAuth</Text>
          </View>

          <View className="bg-white/5 rounded-[40px] p-8 border border-white/10">
            <Text className="text-white text-2xl font-bold mb-8">Login</Text>

            {/* Email Field */}
            <View 
              style={{ borderColor: isEmailFocused ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
              className="mb-5 rounded-3xl border bg-white/5 px-5 py-5 flex-row items-center"
            >
              <Ionicons name="mail-outline" size={20} color="#94a3b8" className="mr-4" />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ color: '#ffffff' }}
                className="flex-1 text-lg font-medium"
              />
            </View>

            {/* Password Field */}
            <View 
              style={{ borderColor: isPassFocused ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
              className="mb-8 rounded-3xl border bg-white/5 px-5 py-5 flex-row items-center"
            >
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" className="mr-4" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
                secureTextEntry={!showPassword}
                style={{ color: '#ffffff' }}
                className="flex-1 text-lg font-medium"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9} className="rounded-3xl overflow-hidden shadow-2xl">
              <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-lg uppercase tracking-widest">Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-500 font-medium">New? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-indigo-400 font-bold">Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};