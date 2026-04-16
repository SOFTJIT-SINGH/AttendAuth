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
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

type Role = 'HOD' | 'TEACHER' | 'STUDENT';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { loadDeviceId } = useAuthStore();

  const takeSignupPhoto = async () => {
    if (!permission?.granted) {
      const resp = await requestPermission();
      if (!resp.granted) {
        Alert.alert('Permission needed', 'We need camera access to capture your face for registration.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
       const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
       if (photo?.base64) {
          setPhotoBase64(photo.base64);
          // Store locally as requested
          await SecureStore.setItemAsync(`face_ref_${email}`, photo.base64);
          setShowCamera(false);
       }
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (role === 'STUDENT' && !photoBase64) {
       Alert.alert('FaceID Needed', 'Please capture your face photo to complete student registration.');
       return;
    }

    setLoading(true);
    const deviceId = await loadDeviceId();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            role, 
            device_id: deviceId, 
            phone,
            face_ref_blob: photoBase64 // Store in DB for sync
          } 
        },
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

  if (showCamera) {
    return (
      <View className="flex-1 bg-black">
        <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef} />
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity onPress={handleCapture} className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
            <View className="w-16 h-16 bg-white rounded-full" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

            {role === 'STUDENT' && (
               <TouchableOpacity onPress={takeSignupPhoto} className={`p-5 rounded-[28px] border-2 border-dashed items-center justify-center mb-2 ${photoBase64 ? 'border-emerald-500 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/5'}`}>
                  {photoBase64 ? (
                    <Text className="text-emerald-500 font-black text-[10px] uppercase">✓ Face Captured</Text>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={24} color="#6366f1" />
                      <Text className="text-indigo-400 font-bold text-[10px] uppercase mt-2">Click to Capture FaceID</Text>
                    </>
                  )}
               </TouchableOpacity>
            )}

             <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="call-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput placeholder="Phone" placeholderTextColor="#475569" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ color: '#ffffff' }} className="flex-1 text-sm font-bold" />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="mail-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput placeholder="Email" placeholderTextColor="#475569" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ color: '#ffffff' }} className="flex-1 text-sm font-bold" />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex-row items-center">
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" className="mr-4" />
              <TextInput placeholder="Password" placeholderTextColor="#475569" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={{ color: '#ffffff' }} className="flex-1 text-sm font-bold" />
            </View>
          </View>

          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9} className="rounded-[30px] overflow-hidden shadow-2xl mt-8">
            <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center justify-center">
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-sm uppercase tracking-[4px]">Join Now</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 items-center">
             <Text className="text-gray-600 font-bold text-xs underline">Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};