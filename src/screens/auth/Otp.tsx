import { useState, useEffect } from 'react';
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

export const OtpScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { email } = route?.params || {};
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { setSession } = useAuthStore();

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Session lost.', [{ text: 'Back', onPress: () => navigation.navigate('Register') }]);
    }
  }, [email]);

  const handleVerify = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'signup' });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles')
          .select('id, email, role, is_verified, phone, device_id, face_ref_blob')
          .eq('id', data.user.id).single();
        if (profile) setSession(profile as UserProfile);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <View className="absolute inset-0">
        <View className="absolute top-[20%] left-[-10%] w-[100%] h-[50%] rounded-full opacity-10 blur-[100px] bg-indigo-500" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}} className="px-8" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-indigo-500/10 rounded-full items-center justify-center border border-indigo-500/20 mb-6">
              <Ionicons name="shield-checkmark" size={40} color="#818cf8" />
            </View>
            <Text className="text-white text-3xl font-black text-center">Verification</Text>
            <Text className="text-gray-500 text-sm mt-3 text-center leading-5 uppercase tracking-widest font-bold">
              Sent to: <Text className="text-indigo-400 font-black">{email}</Text>
            </Text>
          </View>

          <View className="bg-white/5 rounded-[40px] p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
            <Text className="text-white text-xl font-bold mb-8 text-center">Authentication Code</Text>

            <View className="flex-row justify-center space-x-3 gap-3 mb-10">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} className={`w-10 h-14 rounded-2xl border-2 items-center justify-center ${token.length > i ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5'}`}>
                  <Text className="text-white text-2xl font-black">{token[i] || ''}</Text>
                </View>
              ))}
              <TextInput
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }}
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              onPress={handleVerify} 
              disabled={loading || token.length !== 6} 
              activeOpacity={0.9}
              className={`rounded-3xl overflow-hidden shadow-2xl ${token.length === 6 ? 'opacity-100' : 'opacity-50'}`}
            >
              <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-lg uppercase tracking-widest">Verify Identity</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="mt-10 self-center">
              <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Didn't get code? <Text className="text-indigo-400">Resend</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
