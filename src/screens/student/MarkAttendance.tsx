import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { checkGeofence, isWithinTimeWindow } from '../../services/security';
import { verifyFace } from '../../services/gemini';
import { logAttendance } from '../../services/audit';
import * as Location from 'expo-location';
import { ClassSchedule } from '../../types';

export const MarkAttendance = () => {
  const [permission, request] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const { user } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');

  useEffect(() => {
    const init = async () => {
      // Load Schedule
      const { data } = await supabase.from('class_schedules').select('*').limit(1).single();
      if (data) setSchedule(data);

      // Request Location Permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    };
    init();
  }, []);

  const capture = async () => {
    if (!cameraRef.current || !schedule || !user) return;
    setLoading(true);
    setStatus('idle');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      setPreview(photo.uri);

      const geo = await checkGeofence({ lat: schedule.geofence_lat, lon: schedule.geofence_lon, radius: schedule.geofence_radius_m });
      const inTime = isWithinTimeWindow(schedule.start_time, schedule.end_time);

      if (!geo.inZone || !inTime) {
        setStatus('error');
        Alert.alert('Access Denied', 'Outside geofence or class time window.');
        setLoading(false);
        return;
      }

      const { match, confidence } = await verifyFace(user.face_ref_blob || '', photo.base64 || '');
      const attendStatus = match ? 'PRESENT' : 'PENDING_APPROVAL';

      await logAttendance({
        id: crypto.randomUUID(), student_id: user.id, class_id: schedule.id, status: attendStatus,
        marked_at: new Date().toISOString(), location: { lat: geo.coords.latitude, lon: geo.coords.longitude },
        device_id: await useAuthStore.getState().loadDeviceId(), ai_confidence: confidence,
      });

      setStatus(match ? 'success' : 'pending');
      Alert.alert(
        match ? '✅ Success' : '⏳ Pending',
        match ? 'Attendance marked successfully.' : 'Sent for teacher review.',
      );
    } catch (e) {
      setStatus('error');
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted || !locationPermission) {
    return (
      <LinearGradient colors={['#0F0C29', '#302B63', '#24243E']} className="flex-1 justify-center items-center px-8">
        <View className="w-24 h-24 rounded-full bg-indigo-500/15 border-2 border-indigo-500/30 justify-center items-center mb-5">
          <Ionicons name={!permission?.granted ? "camera-outline" : "location-outline"} size={48} color="#6C63FF" />
        </View>
        <Text className="text-white text-2xl font-extrabold mb-2 text-center">
          {!permission?.granted ? 'Camera Needed' : 'Location Needed'}
        </Text>
        <Text className="text-gray-400 text-sm text-center leading-5 mb-8">
          {!permission?.granted 
            ? 'We need camera access to verify your identity.' 
            : 'Geofencing requires location access to verify you are in the classroom.'}
        </Text>
        <TouchableOpacity 
          onPress={!permission?.granted ? request : () => Location.requestForegroundPermissionsAsync().then(r => setLocationPermission(r.status === 'granted'))} 
          activeOpacity={0.85} 
          className="w-full rounded-2xl overflow-hidden"
        >
          <LinearGradient colors={['#6C63FF', '#48CAE4']} className="py-4 items-center">
            <Text className="text-white font-bold text-base">Grant Access</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const captureColors = status === 'success' ? ['#11998e', '#38ef7d'] : status === 'error' ? ['#FF416C', '#FF4B2B'] : ['#6C63FF', '#48CAE4'];

  return (
    <View className="flex-1 bg-black">
      <CameraView className="flex-1" facing="front" ref={cameraRef} />

      {/* Top Banner */}
      <LinearGradient colors={['rgba(15,12,41,0.9)', 'transparent']} className="absolute top-0 left-0 right-0 pt-14 pb-6 px-5">
        <Text className="text-white text-2xl font-extrabold mb-2 tracking-tight">Scanner</Text>
        {schedule && (
          <View className="flex-row items-center bg-cyan-400/20 self-start px-2.5 py-1 rounded-full border border-cyan-400/30">
            <Ionicons name="book-outline" size={12} color="#48CAE4" className="mr-1" />
            <Text className="text-cyan-400 text-[10px] font-bold uppercase">{schedule.subject}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Guide */}
      <View className="absolute inset-0 justify-center items-center" pointerEvents="none">
        <View className="w-[240px] h-[320px] rounded-[120px] border-2 border-indigo-500/60 border-dashed" />
      </View>

      {/* Thumbnail */}
      {preview && (
        <View className="absolute top-14 right-4 w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/60">
          <Image source={{ uri: preview }} className="w-full h-full" />
          {status === 'success' && (
            <View className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 justify-center items-center">
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Bottom Controls */}
      <LinearGradient colors={['transparent', 'rgba(15,12,41,0.95)']} className="absolute bottom-0 left-0 right-0 pt-10 pb-10 items-center">
        <Text className="text-white/50 text-[10px] font-bold uppercase mb-5 tracking-widest">Position your face in the oval</Text>
        <TouchableOpacity onPress={capture} disabled={loading} activeOpacity={0.85} className="w-20 h-20 rounded-full border-4 border-white/20 items-center justify-center mb-2.5">
          <LinearGradient colors={captureColors as [string, string]} className="w-16 h-16 rounded-full items-center justify-center">
            {loading ? <ActivityIndicator color="#fff" size="large" /> : <Ionicons name="camera" size={32} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
        <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wide">
          {loading ? 'Verifying...' : 'Tap to scan'}
        </Text>
      </LinearGradient>
    </View>
  );
};