import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { checkGeofence, isWithinTimeWindow } from '../../services/security';
import { verifyFace } from '../../services/gemini';
import { logAttendance } from '../../services/audit';
import { ClassSchedule } from '../../types';

export const MarkAttendance = () => {
  const [permission, request] = useCameraPermissions();
  const { user } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      const { data } = await supabase.from('class_schedules').select('*').limit(1).single();
      if (data) setSchedule(data);
    };
    loadSchedule();
  }, []);

  const capture = async () => {
    if (!cameraRef.current || !schedule || !user) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      setPreview(photo.uri);

      const geo = await checkGeofence({ lat: schedule.geofence_lat, lon: schedule.geofence_lon, radius: schedule.geofence_radius_m });
      const inTime = isWithinTimeWindow(schedule.start_time, schedule.end_time);

      if (!geo.inZone || !inTime) {
        Alert.alert('Access Denied', 'Outside geofence or class time window.');
        setLoading(false); return;
      }

      const { match, confidence } = await verifyFace(user.face_ref_blob || '', photo.base64 || '');
      const status = match ? 'PRESENT' : 'PENDING_APPROVAL';

      await logAttendance({
        id: crypto.randomUUID(), student_id: user.id, class_id: schedule.id, status,
        marked_at: new Date().toISOString(), location: { lat: geo.coords.latitude, lon: geo.coords.longitude },
        device_id: await useAuthStore.getState().loadDeviceId(), ai_confidence: confidence
      });

      Alert.alert(match ? 'Success' : 'Pending', match ? 'Attendance marked.' : 'Sent for teacher approval.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <Text className="text-white mb-4">Camera access needed</Text>
        <TouchableOpacity onPress={request} className="bg-blue-600 px-4 py-2 rounded"><Text className="text-white">Grant</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 relative">
      <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef} />
      {preview && <Image source={{ uri: preview }} className="absolute top-4 right-4 w-24 h-24 rounded border-2 border-white" />}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <TouchableOpacity onPress={capture} disabled={loading} className="bg-green-600 w-40 h-40 rounded-full items-center justify-center border-4 border-white">
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-center">Mark</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};