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
  const { setSession } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Details Needed', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, is_verified, device_id')
        .eq('id', data.user!.id)
        .single();

      if (profile) {
        setSession(profile as UserProfile);
      } else {
        // DB unreachable or profile missing — build from auth metadata
        // so the user is not stuck on a blank login screen.
        const isNetworkError = !profileError?.code || profileError?.message?.includes('Network');
        if (isNetworkError) {
          const meta = data.user!.user_metadata || {};
          const offlineProfile: UserProfile = {
            id: data.user!.id,
            email: data.user!.email || email.trim().toLowerCase(),
            full_name: meta.full_name || 'User',
            role: (meta.role as UserProfile['role']) || 'STUDENT',
            is_verified: meta.role === 'HOD' || false,
            phone: meta.phone || null,
            device_id: meta.device_id || null,
            face_ref_blob: null,
          };
          Alert.alert(
            'Database Unreachable',
            'You are authenticated, but the database is not responding. You can still use the app in limited mode.',
            [{ text: 'Continue', onPress: () => setSession(offlineProfile) }]
          );
        } else if (profileError?.code === 'PGRST116') {
          // Self-heal: profile row doesn't exist yet
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: data.user!.id,
              email: data.user!.email,
              full_name: data.user!.user_metadata?.full_name || 'User',
              role: data.user!.user_metadata?.role || 'STUDENT',
              device_id: data.user!.user_metadata?.device_id || 'unknown',
            })
            .select('id, email, full_name, phone, role, is_verified, device_id')
            .single();
          if (newProfile) setSession(newProfile as UserProfile);
        } else {
          Alert.alert('Profile Error', profileError?.message || 'Could not load your profile.');
        }
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <View className="absolute top-[-5%] w-full h-[35%] opacity-20">
        <LinearGradient colors={['#6366f1', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-10" keyboardShouldPersistTaps="handled">
          
          <View className="mb-14 items-center">
            <View className="w-20 h-20 bg-white/5 border border-white/10 rounded-[28px] items-center justify-center shadow-xl">
               <Ionicons name="finger-print" size={42} color="#fff" />
            </View>
            <Text className="text-white text-4xl font-black tracking-tight mt-6 italic">Secure Entry</Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mt-2">AttendAuth Logic</Text>
          </View>

          <View className="space-y-4 gap-4">
            <View className="bg-white/5 border border-white/10 rounded-[30px] p-5 flex-row items-center">
              <Ionicons name="mail-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={(t) => setEmail(t.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ color: '#ffffff' }}
                className="flex-1 text-base font-bold"
              />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[30px] p-5 flex-row items-center">
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ color: '#ffffff' }}
                className="flex-1 text-base font-bold"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9} className="mt-6 rounded-[30px] overflow-hidden shadow-2xl shadow-indigo-500/20">
              <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center justify-center">
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-black text-lg uppercase tracking-[2px] mx-auto py-2">Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} className="pt-8 items-center">
              <Text className="text-gray-500 text-md font-semibold">Need an account? <Text className="text-indigo-400 font-bold underline">Register</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};