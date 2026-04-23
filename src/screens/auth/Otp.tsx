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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Session lost.', [{ text: 'Back', onPress: () => navigation.navigate('Register') }]);
    }
  }, [email]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const fetchAndSetProfile = async (userId: string, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      console.log(`Fetching profile attempt ${i + 1}...`);
      const { data: profile } = await supabase.from('profiles')
        .select('id, email, role, is_verified, phone, device_id, face_ref_blob')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setSession(profile as UserProfile);
        return;
      }
      // Wait 1s before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // If we still don't have a profile, something is wrong with the trigger
    // or the session needs to be manually refreshed.
    Alert.alert(
      'Account Created', 
      'Your email is verified! Please sign in to complete your profile.',
      [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
    );
  };

  const handleVerify = async () => {
    const cleanToken = token.trim();
    if (cleanToken.length !== 6 || loading) return;
    setLoading(true);
    
    try {
      console.log('Verifying OTP for:', email.trim().toLowerCase());
      // Try Signup first (Standard)
      let { data, error } = await supabase.auth.verifyOtp({ 
        email: email.trim().toLowerCase(), 
        token: cleanToken, 
        type: 'signup' 
      });
      
      // If signup fails, try magiclink (if they already existed)
      if (error) {
        console.log('Signup Verify failed, trying magiclink...');
        const res = await supabase.auth.verifyOtp({ 
          email: email.trim(), 
          token: cleanToken, 
          type: 'magiclink' 
        });
        data = res.data;
        error = res.error;
      }

      // If still fails, try email (generic)
      if (error) {
        console.log('Magiclink Verify failed, trying email type...');
        const res = await supabase.auth.verifyOtp({ 
          email: email.trim(), 
          token: cleanToken, 
          type: 'email' as any 
        });
        data = res.data;
        error = res.error;
      }
      
      if (error) {
         console.log('All verification types failed:', error.message);
         throw error;
      }

      if (data.user) {
        console.log('Verification successful');
        
        try {
          const safeKey = `face_ref_${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
          const savedPhoto = await AsyncStorage.getItem(safeKey);
          if (savedPhoto) {
            console.log('Syncing face data to profile...');
            await supabase.from('profiles').update({ face_ref_blob: savedPhoto }).eq('id', data.user.id);
            await AsyncStorage.removeItem(safeKey);
          }
        } catch (err) {
          console.error('Failed to sync face blob:', err);
        }

        await fetchAndSetProfile(data.user.id);
      } else {
        throw new Error('Verification failed. No user returned.');
      }
    } catch (e: any) {
      console.error('OTP Verification Exception:', e);
      const isExpired = e.message.toLowerCase().includes('expired');
      Alert.alert(
        'Verification Failed', 
        isExpired 
          ? 'This code has expired or has already been used. Please try "Resend" to get a fresh code.' 
          : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || resendTimer > 0) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) throw error;
      setResendTimer(60);
      Alert.alert('Success', 'New code sent!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setResendLoading(false);
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

            <TouchableOpacity 
              onPress={handleResend} 
              disabled={resendLoading || resendTimer > 0} 
              className="mt-10 self-center"
            >
              <Text className={`font-bold uppercase tracking-widest text-[10px] ${resendTimer > 0 ? 'text-gray-600' : 'text-indigo-400'}`}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't get code? Resend"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} className="mt-4 self-center">
              <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px] opacity-50">Change Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
