import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export const TeacherReports = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('attendance_logs')
        .select('*, profiles!inner(email)')
        .eq('status', 'PENDING_APPROVAL');
      setPending(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from('attendance_logs')
      .update({ status: 'PRESENT' })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else setPending((prev) => prev.filter((i) => i.id !== id));
  };

  const renderItem = ({ item }: { item: any }) => {
    const initials = item.profiles.email.slice(0, 2).toUpperCase();
    const confidence = item.ai_confidence != null ? Math.round(item.ai_confidence) : null;
    const confColor = confidence == null ? '#9CA3AF' : confidence >= 80 ? '#34D399' : confidence >= 60 ? '#FBBF24' : '#F87171';
    const confTailwind = confidence == null ? 'bg-gray-400' : confidence >= 80 ? 'bg-emerald-400' : confidence >= 60 ? 'bg-amber-400' : 'bg-red-400';

    return (
      <View className="bg-white/5 rounded-3xl p-4 mb-3.5 border border-white/10 shadow-sm">
        <View className="flex-row items-center mb-3.5">
          <View className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/30 justify-center items-center mr-3">
            <Text className="text-orange-500 font-extrabold text-sm">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-bold mb-0.5" numberOfLines={1}>{item.profiles.email}</Text>
            <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">{new Date(item.marked_at).toLocaleString()}</Text>
          </View>
          {confidence != null && (
            <View className={`px-2 py-1 rounded-lg bg-black/20 border border-white/5`}>
              <Text className="text-[10px] font-black" style={{ color: confColor }}>{confidence}%</Text>
            </View>
          )}
        </View>

        {confidence != null && (
          <View className="h-1 bg-white/5 rounded-full mb-1.5 overflow-hidden">
            <View className={`h-full rounded-full ${confTailwind}`} style={{ width: `${confidence}%` }} />
          </View>
        )}
        
        <View className="flex-row items-center mb-4 opacity-60">
          <Ionicons name="analytics-outline" size={10} color="#9CA3AF" className="mr-1" />
          <Text className="text-gray-500 text-[10px] font-bold uppercase">AI Match confidence</Text>
        </View>

        <TouchableOpacity onPress={() => approve(item.id)} activeOpacity={0.85} className="rounded-xl overflow-hidden shadow-md">
          <LinearGradient colors={['#11998e', '#38ef7d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-row justify-center items-center py-3.5 px-4">
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" className="mr-2" />
            <Text className="text-white font-bold text-sm tracking-wide">Approve Student</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#070719', '#1a1a3e', '#070719']} className="flex-1">
      {/* Page Header */}
      <View className="flex-row justify-between items-center px-5 pt-14 pb-5 border-b border-white/10 shadow-lg">
        <View>
          <Text className="text-white text-2xl font-extrabold tracking-tight">Approvals</Text>
          <Text className="text-gray-500 text-xs mt-0.5 font-bold uppercase tracking-tight">{pending.length} requests waiting</Text>
        </View>
        <View className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 justify-center items-center">
          <Ionicons name="hourglass-outline" size={22} color="#F7971E" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color="#F7971E" />
          <Text className="text-gray-500 text-sm font-bold uppercase">Fetching requests...</Text>
        </View>
      ) : pending.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 rounded-full bg-emerald-500/10 justify-center items-center mb-5 border border-emerald-500/20">
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#34D399" />
          </View>
          <Text className="text-white text-lg font-black tracking-wide mb-1.5 uppercase">All Clear!</Text>
          <Text className="text-gray-500 text-sm text-center font-bold">No students pending approval.</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};