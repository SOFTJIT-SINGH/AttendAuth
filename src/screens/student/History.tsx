import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export const AttendanceHistory = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('attendance_logs').select('*').eq('student_id', user!.id).order('marked_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-xl font-bold mb-4">Attendance History</Text>
      {loading ? <ActivityIndicator color="white" /> : (
        <FlatList data={logs} keyExtractor={i => i.id} renderItem={({ item }) => (
          <View className="bg-gray-800 p-4 rounded mb-2">
            <Text className="text-white font-bold">{item.class_id} - {item.status}</Text>
            <Text className="text-gray-400">{new Date(item.marked_at).toLocaleString()}</Text>
          </View>
        )} />
      )}
    </View>
  );
};