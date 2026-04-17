import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Linking, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { verifyFace } from '../../services/gemini';
import { logAttendance } from '../../services/audit';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassSchedule } from '../../types';

// Helper to calculate distance in KM
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const MarkAttendance = () => {
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const { user } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');

  const requestAllPermissions = async () => {
    try {
      await requestCamera();
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
        Alert.alert('Scanner Error', 'Device hardware initializing.');
        return;
    }
    if (!schedule || !user) {
      Alert.alert('System Error', 'Session context lost.');
      return;
    }
    
    setLoading(true);
    setStatus('idle');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true });
      if (!photo?.base64) throw new Error('Capture failed.');
      
      // 1. Precise Location & Distance Calculation
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const distance = calculateDistance(
        loc.coords.latitude, 
        loc.coords.longitude, 
        schedule.geofence_lat, 
        schedule.geofence_lon
      );

      // 2. Identify Reference Image
      const safeKey = `face_ref_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      let referenceFace = await AsyncStorage.getItem(safeKey);
      if (!referenceFace) referenceFace = user.face_ref_blob || '';

      if (!referenceFace) {
         setLoading(false);
         Alert.alert('FaceID Required', 'You haven\'t set up your face identity. Please go to your Profile tab to capture your identity first.');
         return;
      }

      const { match, confidence } = await verifyFace(referenceFace, photo.base64);
      
      // Logic: If in geofence (500m) and matches -> PRESENT
      // Else -> PENDING_APPROVAL
      const inGeofence = distance <= (schedule.geofence_radius_m / 1000 + 0.5); // Add 500m buffer
      let attendStatus = 'PENDING_APPROVAL';
      
      if (match && inGeofence) {
        attendStatus = 'PRESENT';
      }

      await logAttendance({
        id: (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36),
        student_id: user.id,
        class_id: schedule.id,
        status: attendStatus,
        marked_at: new Date().toISOString(),
        location: { lat: loc.coords.latitude, lon: loc.coords.longitude },
        device_id: await useAuthStore.getState().loadDeviceId(),
        ai_confidence: confidence,
        distance_km: parseFloat(distance.toFixed(3)) // Custom field for HOD auditing
      } as any);

      setStatus(attendStatus === 'PRESENT' ? 'success' : 'pending');
      
      const distanceMsg = distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`;
      
      Alert.alert(
        attendStatus === 'PRESENT' ? '✅ Check-In Verified' : '⏳ Review Required',
        attendStatus === 'PRESENT' 
          ? `Status: Present\nDistance: ${distanceMsg} from class.`
          : `Record captured ${distanceMsg} away. Awaiting staff approval due to ${!inGeofence ? 'distance' : 'biometric review'}.`,
      );
    } catch (e) {
      setStatus('error');
      Alert.alert('System Fault', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isCameraGranted = cameraPermission?.status === 'granted';
  const isLocationGranted = locationPermission?.status === 'granted';

  if (!isCameraGranted || !isLocationGranted) {
    return (
      <View className="flex-1 bg-[#020617] justify-center px-10">
          <View className="items-center mb-10">
            <Ionicons name="location-outline" size={64} color="#6366f1" />
            <Text className="text-white text-2xl font-black mt-6">LOCATION RADIUS</Text>
            <Text className="text-gray-500 text-center mt-3 font-medium">We monitor your proximity to the session for automated verification.</Text>
          </View>
          <TouchableOpacity onPress={openSettings} className="bg-indigo-500 py-5 rounded-[30px] items-center">
            <Text className="text-white font-black uppercase">Enable System Access</Text>
          </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef} />
      
      <View className="absolute top-0 left-0 right-0 p-8 pt-16">
        <LinearGradient colors={['rgba(0,0,0,0.85)', 'transparent']} className="absolute inset-0" />
        <View className="flex-row justify-between items-center">
          <View className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
            <Text className="text-white text-[10px] font-black uppercase italic tracking-tighter">{schedule?.subject || 'SCANNING...'}</Text>
          </View>
          <View className="bg-indigo-500/20 px-4 py-2 rounded-2xl border border-indigo-500/30">
            <Text className="text-indigo-500 text-[10px] font-black uppercase">Smart Proximity Active</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 pb-20 pt-10">
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} className="absolute inset-0" />
        <View className="items-center px-10">
          <TouchableOpacity 
            onPress={capture} 
            disabled={loading} 
            className="w-24 h-24 rounded-full border-4 border-white/10 items-center justify-center bg-white/5 shadow-2xl"
          >
            {loading ? <ActivityIndicator color="#fff" size="large" /> : (
              <LinearGradient colors={['#6366f1', '#a855f7']} className="w-20 h-20 rounded-full items-center justify-center">
                <Ionicons name="scan-circle" size={48} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
          <Text className="text-white/40 text-[9px] font-black uppercase tracking-[5px] mt-8 text-center">
             Identity & Radius Audit{'\n'}System Active
          </Text>
        </View>
      </View>
    </View>
  );
};