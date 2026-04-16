import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  PRESENT: { color: '#34D399', bg: 'bg-emerald-500/15', icon: 'checkmark-circle' },
  PENDING_APPROVAL: { color: '#FBBF24', bg: 'bg-amber-500/15', icon: 'hourglass-outline' },
  ABSENT: { color: '#F87171', bg: 'bg-red-500/15', icon: 'close-circle' },
};

export const AttendanceHistory = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('student_id', user!.id)
        .order('marked_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { color: '#9CA3AF', bg: 'bg-gray-500/15', icon: 'ellipse-outline' };
    const date = new Date(item.marked_at);
    return (
      <View className="flex-row items-center bg-white/5 rounded-2xl p-4 mb-2.5 border border-white/10 shadow-sm">
        <View className={`w-11 h-11 rounded-xl justify-center items-center mr-3 ${cfg.bg}`}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-white text-sm font-bold mb-0.5" numberOfLines={1}>{item.class_id}</Text>
          <Text className="text-gray-500 text-[10px] mb-1">{date.toLocaleString()}</Text>
          {item.ai_confidence != null && (
            <Text className="text-gray-400 text-[10px]">Confidence: {Math.round(item.ai_confidence)}%</Text>
          )}
        </View>
        <View className={`px-2.5 py-1 rounded-full ${cfg.bg}`}>
          <Text className="text-[10px] font-bold" style={{ color: cfg.color }}>
            {item.status === 'PENDING_APPROVAL' ? 'Pending' : item.status.charAt(0) + item.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0F0C29', '#1a1a3e', '#0F0C29']} className="flex-1">
      {/* Page Header */}
      <View className="flex-row justify-between items-center px-5 pt-14 pb-5 border-b border-white/10">
        <View>
          <Text className="text-white text-2xl font-extrabold">History</Text>
          <Text className="text-gray-500 text-xs mt-0.5 font-medium">{logs.length} records found</Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-indigo-500/15 border border-indigo-500/30 justify-center items-center">
          <Ionicons name="time" size={22} color="#6C63FF" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text className="text-gray-500 text-sm font-medium">Loading history...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 rounded-full bg-white/5 justify-center items-center mb-4">
            <Ionicons name="document-outline" size={40} color="#4B5563" />
          </View>
          <Text className="text-white text-lg font-bold mb-1.5">No Records Yet</Text>
          <Text className="text-gray-500 text-sm text-center font-medium">Your attendance history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};