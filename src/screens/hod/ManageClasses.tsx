import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { supabase } from '../../services/supabase';

export const ManageClasses = () => {
  const [subject, setSubject] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  const createClass = async () => {
    try {
      const { error } = await supabase.from('class_schedules').insert({
        subject, geofence_lat: parseFloat(lat), geofence_lon: parseFloat(lon),
        start_time: startTime, end_time: endTime
      });
      if (error) throw error;
      Alert.alert('Success', 'Class created');
      setSubject(''); setLat(''); setLon('');
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-xl font-bold mb-4">Create Class</Text>
      <TextInput placeholder="Subject" value={subject} onChangeText={setSubject} className="bg-gray-800 text-white p-3 rounded mb-2" />
      <TextInput placeholder="Lat" value={lat} onChangeText={setLat} keyboardType="numeric" className="bg-gray-800 text-white p-3 rounded mb-2" />
      <TextInput placeholder="Lon" value={lon} onChangeText={setLon} keyboardType="numeric" className="bg-gray-800 text-white p-3 rounded mb-2" />
      <View className="flex-row gap-2 mb-4">
        <TextInput placeholder="Start (HH:MM)" value={startTime} onChangeText={setStartTime} className="bg-gray-800 text-white p-3 rounded flex-1" />
        <TextInput placeholder="End (HH:MM)" value={endTime} onChangeText={setEndTime} className="bg-gray-800 text-white p-3 rounded flex-1" />
      </View>
      <TouchableOpacity onPress={createClass} className="bg-blue-600 p-3 rounded">
        <Text className="text-white text-center font-bold">Create Class</Text>
      </TouchableOpacity>
    </View>
  );
};