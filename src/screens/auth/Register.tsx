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
  Linking,
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
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { loadDeviceId } = useAuthStore();

  const takeSignupPhoto = async () => {
    if (!permission?.granted) {
      const resp = await requestPermission();
      if (!resp.granted) {
        if (!resp.canAskAgain) {
           Alert.alert(
             'Camera Required',
             'You have denied camera permissions. Please enable them in your phone settings to capture your face.',
             [
               { text: 'Cancel', style: 'cancel' },
               { text: 'Open Settings', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings() }
             ]
           );
        } else {
           Alert.alert('Permission needed', 'We need camera access to capture your face for registration.');
        }
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current && !capturing) {
       setCapturing(true);
       try {
         const photo = await cameraRef.current.takePictureAsync({ 
           quality: 0.5, 
           base64: true,
           skipProcessing: false 
         });
         
         if (photo?.base64) {
            setPhotoBase64(photo.base64);
            if (email) {
              await SecureStore.setItemAsync(`face_ref_${email.trim()}`, photo.base64);
            }
            setShowCamera(false);
         } else {
            Alert.alert('Capture Failed', 'Could not process image. Please try again.');
         }
       } catch (err: any) {
         Alert.alert('Camera Error', err.message);
       } finally {
         setCapturing(false);
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
        
        {/* Top Controls */}
        <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => setShowCamera(false)} 
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/20"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <View className="px-4 py-2 bg-indigo-500 rounded-full">
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">Face ID Capture</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Capture Button */}
        <View className="absolute bottom-16 left-0 right-0 items-center">
          <TouchableOpacity 
            onPress={handleCapture} 
            disabled={capturing}
            className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center ${capturing ? 'opacity-50' : 'opacity-100'}`}
          >
            {capturing ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="w-16 h-16 bg-white rounded-full" />
            )}
          </TouchableOpacity>
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest mt-4">Tap to Capture</Text>
        </View>

        {/* Framing Guide */}
        <View className="absolute inset-x-10 top-[20%] bottom-[40%] border-2 border-white/30 rounded-[100px] border-dashed" />
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
                <View className="flex-row items-center mb-2 space-x-3 gap-3">
                  <TouchableOpacity 
                    onPress={takeSignupPhoto} 
                    className={`flex-1 p-5 rounded-[28px] border-2 border-dashed items-center justify-center ${photoBase64 ? 'border-emerald-500 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/5'}`}
                  >
                    {photoBase64 ? (
                      <Text className="text-emerald-500 font-black text-[10px] uppercase">✓ Face Captured</Text>
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={24} color="#6366f1" />
                        <Text className="text-indigo-400 font-bold text-[10px] uppercase mt-2">Capture FaceID</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {photoBase64 && (
                    <View className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500">
                      <Image source={{ uri: `data:image/jpeg;base64,${photoBase64}` }} className="flex-1" />
                    </View>
                  )}
                </View>
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