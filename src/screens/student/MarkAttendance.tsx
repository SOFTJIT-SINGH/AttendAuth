import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Linking, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { checkGeofence } from '../../services/security'; // Removed time window check
import { verifyFace } from '../../services/gemini';
import { logAttendance } from '../../services/audit';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassSchedule } from '../../types';

export const MarkAttendance = () => {
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const { user } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');

  const requestAllPermissions = async () => {
    try {
      const cam = await requestCamera();
      const loc = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(loc);
    } catch (e) {
      console.error('Permission Error:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('class_schedules').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (data) setSchedule(data);
      requestAllPermissions();
    };
    init();
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') Linking.openURL('app-settings:');
    else Linking.openSettings();
  };

  const capture = async () => {
    if (!cameraRef.current) {
        Alert.alert('Scanner Error', 'The camera scanner is still initializing. Please wait a moment.');
        return;
    }
    if (!schedule || !user) {
      Alert.alert('Data Error', 'Cannot find active class session or user identity.');
      return;
    }
    
    setLoading(true);
    setStatus('idle');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true });
      if (!photo?.base64) throw new Error('Failed to capture photo');
      
      setPreview(photo.uri);

      // 1. Geofence Check (With 500m buffer from security.ts)
      const geo = await checkGeofence({ 
        lat: schedule.geofence_lat, 
        lon: schedule.geofence_lon, 
        radius: schedule.geofence_radius_m 
      });

      // TIME WINDOW CHECK REMOVED FOR TESTING PURPOSES AS REQUESTED
      if (!geo.inZone) {
        setStatus('error');
        Alert.alert('Access Denied', 'You must be within the classroom location range.');
        setLoading(false);
        return;
      }

      // 2. Identify Reference Image (AsyncStorage or DB)
      let referenceFace = await AsyncStorage.getItem(`face_ref_${user.email}`);
      if (!referenceFace) {
         console.log('No local reference face found, falling back to database...');
         referenceFace = user.face_ref_blob || '';
      }

      const { match, confidence } = await verifyFace(referenceFace, photo.base64);
      const attendStatus = match ? 'PRESENT' : 'PENDING_APPROVAL';

      await logAttendance({
        id: (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36),
        student_id: user.id,
        class_id: schedule.id,
        status: attendStatus,
        marked_at: new Date().toISOString(),
        location: { lat: geo.coords.latitude, lon: geo.coords.longitude },
        device_id: await useAuthStore.getState().loadDeviceId(),
        ai_confidence: confidence,
      });

      setStatus(match ? 'success' : 'pending');
      Alert.alert(
        match ? '✅ Verified' : '⏳ Review Needed',
        match ? 'Your check-in is complete.' : 'Biometric match low. Sent for staff review.',
      );
    } catch (e) {
      setStatus('error');
      Alert.alert('Scan Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isCameraGranted = cameraPermission?.status === 'granted';
  const isLocationGranted = locationPermission?.status === 'granted';

  if (!isCameraGranted || !isLocationGranted) {
    const showSettings = (cameraPermission && !cameraPermission.canAskAgain && !cameraPermission.granted) || 
                       (locationPermission && !locationPermission.canAskAgain && !locationPermission.granted);

    return (
      <View className="flex-1 bg-[#020617] justify-center px-10">
          <View className="items-center mb-10">
            <Ionicons name="lock-closed-outline" size={64} color="#6366f1" />
            <Text className="text-white text-2xl font-black mt-6">ACCESS REQUIRED</Text>
            <Text className="text-gray-500 text-center mt-3 font-medium">To mark attendance, we need camera and location access.</Text>
          </View>
          
          <TouchableOpacity 
            onPress={showSettings ? openSettings : requestAllPermissions} 
            activeOpacity={0.8}
            className="rounded-3xl overflow-hidden mb-4"
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} className="py-5 items-center">
              <Text className="text-white font-black uppercase tracking-widest">
                {showSettings ? 'Open Phone Settings' : 'Grant Permissions'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {showSettings && (
            <TouchableOpacity onPress={requestAllPermissions} className="items-center py-2">
              <Text className="text-indigo-400 font-bold text-xs">Try permission dialog again</Text>
            </TouchableOpacity>
          )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Explicit style to fix blank camera issue */}
      <CameraView 
        style={{ flex: 1 }}
        facing="front" 
        ref={cameraRef}
      />
      
      <View className="absolute top-0 left-0 right-0 p-8 pt-16">
        <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} className="absolute inset-0" />
        <View className="flex-row justify-between items-center">
          <View className="bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
            <Text className="text-white text-[10px] font-black uppercase">{schedule?.subject || 'TEST MODE'}</Text>
          </View>
          <View className="bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
            <Text className="text-emerald-500 text-[10px] font-black uppercase">GPS Buffer Active</Text>
          </View>
        </View>
      </View>

      <View className="absolute inset-0 justify-center items-center pointer-events-none">
        <View className="w-60 h-60 rounded-full border-2 border-indigo-500 opacity-30 border-dashed" />
      </View>

      <View className="absolute bottom-0 left-0 right-0 pb-20 pt-10">
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} className="absolute inset-0" />
        <View className="items-center px-10">
          <TouchableOpacity 
            onPress={capture} 
            disabled={loading} 
            activeOpacity={0.9} 
            className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 items-center justify-center shadow-2xl"
          >
            {loading ? <ActivityIndicator color="#fff" size="large" /> : (
              <LinearGradient colors={['#6366f1', '#a855f7']} className="w-20 h-20 rounded-full items-center justify-center">
                <Ionicons name="scan" size={36} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
          <Text className="text-white/40 text-[9px] font-black uppercase tracking-[5px] mt-8">Secure Identity Scan</Text>
        </View>
      </View>
    </View>
  );
};