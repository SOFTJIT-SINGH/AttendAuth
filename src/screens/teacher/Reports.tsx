import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export const TeacherReports = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('attendance_logs').select('*, profiles!inner(email)').eq('status', 'PENDING_APPROVAL');
      setPending(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from('attendance_logs').update({ status: 'PRESENT' }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else setPending(prev => prev.filter(i => i.id !== id));
  };

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-xl font-bold mb-4">Pending Approvals</Text>
      {loading ? <ActivityIndicator color="white" /> : (
        <FlatList data={pending} keyExtractor={i => i.id} renderItem={({ item }) => (
          <View className="bg-gray-800 p-4 rounded mb-2 flex-row justify-between items-center">
            <View>
              <Text className="text-white font-bold">{item.profiles.email}</Text>
              <Text className="text-gray-400">Confidence: {item.ai_confidence}%</Text>
            </View>
            <TouchableOpacity onPress={() => approve(item.id)} className="bg-green-600 px-4 py-2 rounded">
              <Text className="text-white font-bold">Approve</Text>
            </TouchableOpacity>
          </View>
        )} />
      )}
    </View>
  );
};