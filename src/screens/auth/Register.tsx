import { useState, useRef } from 'react';
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

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loadDeviceId } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !phone || !fullName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    const deviceId = await loadDeviceId();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { 
          data: { 
            role, 
            full_name: fullName.trim(),
            device_id: deviceId, 
            phone
          } 
        },
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Success', 'Verification code sent.');
        navigation.navigate('Otp', { email: email.trim().toLowerCase() });
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-10 py-10" keyboardShouldPersistTaps="handled">
          
          <View className="mb-8 items-center">
            <Text className="text-white text-4xl font-black italic tracking-tighter">Registration</Text>
            <Text className="text-gray-600 text-[10px] font-black uppercase tracking-[5px] mt-2">Create Profile</Text>
          </View>

          <View className="space-y-3 gap-3">
            {/* Role Picker */}
            <View className="flex-row space-x-2 gap-2 mb-4">
              {['STUDENT', 'TEACHER', 'HOD'].map((r) => (
                <TouchableOpacity 
                  key={r} onPress={() => setRole(r as any)}
                  className={`flex-1 py-3 items-center rounded-2xl border ${role === r ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5'}`}
                >
                  <Text className={`text-[10px] font-black ${role === r ? 'text-white' : 'text-gray-500'}`}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>



             <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="call-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput placeholder="Phone" placeholderTextColor="#475569" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ color: '#ffffff' }} className="flex-1 text-sm font-bold" />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="person-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput placeholder="Full Name" placeholderTextColor="#475569" value={fullName} onChangeText={setFullName} style={{ color: '#ffffff' }} className="flex-1 text-sm font-bold" />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="mail-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput 
                placeholder="Email" 
                placeholderTextColor="#475569" 
                value={email} 
                onChangeText={(t) => setEmail(t.toLowerCase())} 
                keyboardType="email-address"
                autoCapitalize="none" 
                style={{ color: '#ffffff' }} 
                className="flex-1 text-base font-bold" 
              />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput 
                placeholder="Password" 
                placeholderTextColor="#475569" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} 
                autoCapitalize="none"
                autoCorrect={false}
                style={{ color: '#ffffff' }} 
                className="flex-1 text-sm font-bold" 
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 10, marginRight: -10 }}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color={showPassword ? '#6366f1' : '#475569'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9} className="rounded-[30px] overflow-hidden shadow-2xl mt-8">
            <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center justify-center">
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase tracking-[2px] py-2 text-lg">Join Now</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 items-center">
             <Text className="text-gray-600 font-bold text-md underline">Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};