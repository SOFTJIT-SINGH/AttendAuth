import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import * as Location from 'expo-location';

export const ManageClasses = ({ navigation }: any) => {
  const [subject, setSubject] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user } = useAuthStore();

  const getCurrentLocation = async () => {
    setLocLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to capture current coordinates.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(location.coords.latitude.toString());
      setLon(location.coords.longitude.toString());
      Alert.alert('Location Captured', 'Coordinates have been synced from your current position.');
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLocLoading(false);
    }
  };

  const createClass = async () => {
    if (!subject) {
      Alert.alert('Error', 'Subject name is required.');
      return;
    }
    setLoading(true);
    try {
      // If coordinates are empty, we store 0.0 or handle as optional
      const finalLat = lat ? parseFloat(lat) : 0;
      const finalLon = lon ? parseFloat(lon) : 0;

      const { error } = await supabase.from('class_schedules').insert({
        subject,
        teacher_id: user?.id,
        geofence_lat: finalLat,
        geofence_lon: finalLon,
        start_time: startTime,
        end_time: endTime,
        geofence_radius_m: (lat && lon) ? 50 : 999999 // Disable range check if optional
      });
      if (error) throw error;
      Alert.alert('Success', 'Class schedule has been created.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <View className="absolute top-0 w-full h-[30%] opacity-15">
        <LinearGradient colors={['#0ea5e9', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-6 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-2xl bg-white/5 justify-center items-center mr-4 border border-white/10">
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-2xl font-black tracking-tight">Create Class</Text>
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mt-0.5">Setup Attendance Check</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Subject Card */}
        <View className="bg-white/5 rounded-[35px] border border-white/10 p-6 mb-6">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Class Identification</Text>
          <View className={`flex-row items-center bg-white/5 rounded-2xl border px-4 py-4 ${focusedField === 'subject' ? 'border-sky-500 bg-sky-500/5' : 'border-white/5'}`}>
            <Ionicons name="book-outline" size={18} color={focusedField === 'subject' ? '#0ea5e9' : '#4b5563'} className="mr-3" />
            <TextInput
              placeholder="Subject Name (e.g. Physics)" placeholderTextColor="#4b5563"
              value={subject} onChangeText={setSubject}
              onFocus={() => setFocusedField('subject')} onBlur={() => setFocusedField(null)}
              style={{ color: '#fff' }} className="flex-1 text-base font-medium"
            />
          </View>
        </View>

        {/* Location Card */}
        <View className="bg-white/5 rounded-[35px] border border-white/10 p-6 mb-6">
          <View className="flex-row justify-between items-center mb-4 text-center">
             <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Location  (Optional)</Text>
             <TouchableOpacity disabled={locLoading} onPress={getCurrentLocation} className="flex-row items-center bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                {locLoading ? <ActivityIndicator size="small" color="#0ea5e9" /> : (
                  <>
                    <Ionicons name="location" size={12} color="#0ea5e9" className="mr-1" />
                    <Text className="text-sky-500 text-[9px] font-black uppercase tracking-tighter">Use Current Location</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3 gap-3">
             <View style={{ flex: 1, borderColor: focusedField === 'lat' ? '#0ea5e9' : 'transparent' }} className="bg-white/5 rounded-2xl border p-4">
                <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Latitude</Text>
                <TextInput
                  placeholder="0.0000" placeholderTextColor="#334155"
                  value={lat} onChangeText={setLat} keyboardType="decimal-pad"
                  onFocus={() => setFocusedField('lat')} onBlur={() => setFocusedField(null)}
                  style={{ color: '#fff' }} className="text-sm font-bold"
                />
             </View>
             <View style={{ flex: 1, borderColor: focusedField === 'lon' ? '#0ea5e9' : 'transparent' }} className="bg-white/5 rounded-2xl border p-4">
                <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Longitude</Text>
                <TextInput
                  placeholder="0.0000" placeholderTextColor="#334155"
                  value={lon} onChangeText={setLon} keyboardType="decimal-pad"
                  onFocus={() => setFocusedField('lon')} onBlur={() => setFocusedField(null)}
                  style={{ color: '#fff' }} className="text-sm font-bold"
                />
             </View>
          </View>
          <Text className="text-gray-600 text-[8px] font-bold mt-4 uppercase tracking-widest text-center">Leave blank to skip range checks for this class</Text>
        </View>

        {/* Schedule Grid */}
        <View className="bg-white/5 rounded-[35px] border border-white/10 p-6 mb-8">
           <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Timeline</Text>
           <View className="flex-row items-center justify-between">
              <View className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Starts</Text>
                <TextInput value={startTime} onChangeText={setStartTime} style={{ color: '#fff' }} className="text-lg font-black tracking-tight" />
              </View>
              <View className="px-3">
                <Ionicons name="arrow-forward" size={16} color="#0ea5e9" />
              </View>
              <View className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Ends</Text>
                <TextInput value={endTime} onChangeText={setEndTime} style={{ color: '#fff' }} className="text-lg font-black tracking-tight" />
              </View>
           </View>
        </View>

        <TouchableOpacity onPress={createClass} disabled={loading} activeOpacity={0.9} className="rounded-[30px] overflow-hidden shadow-2xl shadow-sky-500/20">
          <LinearGradient colors={['#0ea5e9', '#0284c7']} className="py-5 items-center justify-center flex-row">
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" className="mr-2.5" />
                <Text className="text-white font-black text-base uppercase tracking-[3px]">Add Class</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};