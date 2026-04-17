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
        email: email.trim(), 
        password 
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
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
                onChangeText={setEmail}
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