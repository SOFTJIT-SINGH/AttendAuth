import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export const ManageClasses = ({ navigation }: any) => {
  const [subject, setSubject] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const createClass = async () => {
    if (!subject || !lat || !lon) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('class_schedules').insert({
        subject,
        geofence_lat: parseFloat(lat),
        geofence_lon: parseFloat(lon),
        start_time: startTime,
        end_time: endTime,
      });
      if (error) throw error;
      Alert.alert('Success', 'Class schedule has been created.');
      setSubject(''); setLat(''); setLon('');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'subject', label: 'Subject Name', placeholder: 'e.g. Mathematics', icon: 'book-outline', value: subject, setter: setSubject, keyboard: 'default' as const },
    { key: 'lat', label: 'Geofence Latitude', placeholder: 'e.g. 28.7041', icon: 'location-outline', value: lat, setter: setLat, keyboard: 'decimal-pad' as const },
    { key: 'lon', label: 'Geofence Longitude', placeholder: 'e.g. 77.1025', icon: 'compass-outline', value: lon, setter: setLon, keyboard: 'decimal-pad' as const },
  ];

  return (
    <LinearGradient colors={['#0F0C29', '#1a1a3e', '#0F0C29']} className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-white/10 shadow-md">
        <TouchableOpacity onPress={() => navigation?.goBack?.()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center mr-3 border border-white/5">
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-black">Create Class</Text>
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Setup attendance session</Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-indigo-500/15 border border-indigo-500/30 justify-center items-center">
          <Ionicons name="add-circle-outline" size={22} color="#6C63FF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="flex-row items-start bg-cyan-400/10 rounded-2xl p-4 border border-cyan-400/20 mb-5">
          <Ionicons name="information-circle-outline" size={18} color="#48CAE4" className="mr-3" />
          <Text className="text-gray-400 text-xs leading-5 flex-1 font-medium">
            Define classroom geofence coordinates to validate student attendance.
          </Text>
        </View>

        {/* Form */}
        <View className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg mb-6">
          <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[2px] mb-4 px-1">Class Info</Text>

          {FIELDS.map((f) => (
            <View key={f.key} className="mb-4">
              <Text className="text-gray-500 text-[10px] font-bold uppercase px-1 mb-2">{f.label}</Text>
              <View className={`flex-row items-center bg-white/5 rounded-2xl border px-4 py-4 ${focusedField === f.key ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10'}`}>
                <Ionicons name={f.icon as any} size={18} color={focusedField === f.key ? '#6C63FF' : '#4B5563'} className="mr-3" />
                <TextInput
                  placeholder={f.placeholder} placeholderTextColor="#4B5563"
                  value={f.value} onChangeText={f.setter} keyboardType={f.keyboard}
                  onFocus={() => setFocusedField(f.key)} onBlur={() => setFocusedField(null)}
                  className="flex-1 text-white text-base font-medium"
                />
              </View>
            </View>
          ))}

          <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[2px] mt-2 mb-4 px-1">Schedule</Text>
          <View className="flex-row items-end space-x-2 gap-2">
            <View className="flex-1">
              <Text className="text-gray-500 text-[10px] font-bold uppercase px-1 mb-2">Start</Text>
              <View className={`flex-row items-center bg-white/5 rounded-2xl border px-4 py-4 ${focusedField === 'start' ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10'}`}>
                <TextInput
                  placeholder="09:00" placeholderTextColor="#4B5563"
                  value={startTime} onChangeText={setStartTime}
                  onFocus={() => setFocusedField('start')} onBlur={() => setFocusedField(null)}
                  className="flex-1 text-white text-base font-medium text-center"
                />
              </View>
            </View>
            <View className="pb-5">
              <Ionicons name="arrow-forward" size={16} color="#4B5563" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-[10px] font-bold uppercase px-1 mb-2">End</Text>
              <View className={`flex-row items-center bg-white/5 rounded-2xl border px-4 py-4 ${focusedField === 'end' ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10'}`}>
                <TextInput
                  placeholder="10:30" placeholderTextColor="#4B5563"
                  value={endTime} onChangeText={setEndTime}
                  onFocus={() => setFocusedField('end')} onBlur={() => setFocusedField(null)}
                  className="flex-1 text-white text-base font-medium text-center"
                />
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={createClass} disabled={loading} activeOpacity={0.85} className="rounded-2xl overflow-hidden shadow-2xl">
          <LinearGradient colors={['#6C63FF', '#48CAE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="py-5 items-center">
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" className="mr-2.5" />
                <Text className="text-white font-black text-base uppercase tracking-widest">Create Class</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};