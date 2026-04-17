import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export const TeacherHistory = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async (isRefresh = false) => {
    if (!isRefresh) setInitialLoading(true);
    
    try {
      let query = supabase
        .from('attendance_logs')
        .select(`
          *,
          profiles:student_id (email, full_name),
          class_schedules!inner (subject, teacher_id)
        `)
        .order('marked_at', { ascending: false });

      if (user?.role === 'TEACHER') {
        query = query.eq('class_schedules.teacher_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (e: any) {
      Alert.alert('Fetch Error', e.message);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setRecords(prevRecords => 
      prevRecords.map(record => 
        record.id === id ? { ...record, status: newStatus } : record
      )
    );

    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .update({ status: newStatus })
        .eq('id', id)
        .select('id');
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Silent DB failure: Missing update permissions (RLS).");
    } catch (e: any) {
       Alert.alert('Modification Failed', e.message);
       fetchRecords(true); 
    }
  };

  const deleteRecord = async (id: string) => {
    Alert.alert('Erase Audit Log', 'This action will permanently delete this record. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: async () => {
        setRecords(prev => prev.filter(r => r.id !== id));
        const { error } = await supabase.from('attendance_logs').delete().eq('id', id);
        if (error) fetchRecords(true); 
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const confidence = item.ai_confidence != null ? Math.round(Number(item.ai_confidence)) : null;
    const confColor = confidence == null ? '#94a3b8' : confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444';
    const distance = item.distance_km != null ? Number(item.distance_km) : null;
    const distanceText = distance != null ? (distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`) : 'N/A';
    const isOutRange = distance != null && distance > 0.6;

    let statusBgClass = 'bg-amber-500/10 border-amber-500/20';
    let statusTextClass = 'text-amber-500';
    
    if (item.status === 'PRESENT') {
      statusBgClass = 'bg-emerald-500/10 border-emerald-500/20';
      statusTextClass = 'text-emerald-500';
    } else if (item.status === 'ABSENT') {
      statusBgClass = 'bg-red-500/10 border-red-500/20';
      statusTextClass = 'text-red-500';
    }

    return (
      <View className="bg-white/5 rounded-[35px] p-6 mb-4 border border-white/10">
        <View className="flex-row items-center mb-6">
          <View className="w-14 h-14 rounded-2xl bg-indigo-500/10 items-center justify-center mr-4 border border-indigo-500/20">
            <Text className="text-indigo-400 font-black text-lg">
              {(item.profiles?.full_name || item.profiles?.email || 'U').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-black text-base" numberOfLines={1}>
              {item.profiles?.full_name || item.profiles?.email}
            </Text>
            <Text className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">
              {item.class_schedules?.subject || 'Direct Entry'}
            </Text>
          </View>
          <View className="items-end">
            <View className={['px-2 py-1 rounded-lg border', statusBgClass].join(' ')}>
              <Text className={['text-[8px] font-black uppercase', statusTextClass].join(' ')}>
                {item.status ? String(item.status).replace('_', ' ') : 'UNKNOWN'}
              </Text>
            </View>
            <Text className="text-gray-600 text-[8px] font-bold mt-2">{new Date(item.marked_at).toLocaleTimeString()}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-4">
           <View className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Text className="text-gray-600 text-[8px] font-black uppercase tracking-widest mb-1 text-center">Identity Match</Text>
              <Text style={{ color: confColor }} className="text-sm font-black text-center">{confidence || 0}%</Text>
           </View>
           <View className={['flex-1 p-3 rounded-2xl border', isOutRange ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'].join(' ')}>
              <Text className="text-gray-600 text-[8px] font-black uppercase tracking-widest mb-1 text-center">Distance Log</Text>
              <Text className={['text-sm font-black text-center', isOutRange ? 'text-red-500' : 'text-white'].join(' ')}>{distanceText}</Text>
           </View>
        </View>

        {confidence !== null && (
          <View className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
              <View className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: confColor }} />
          </View>
        )}

        <View className="flex-row gap-2 mt-2">
           {item.status !== 'PRESENT' && (
             <TouchableOpacity 
               onPress={() => updateStatus(item.id, 'PRESENT')}
               className="flex-1 py-3 rounded-xl items-center justify-center bg-emerald-500/10 border border-emerald-500/20"
             >
               <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Mark Present</Text>
             </TouchableOpacity>
           )}
           
           {item.status !== 'ABSENT' && (
             <TouchableOpacity 
               onPress={() => updateStatus(item.id, 'ABSENT')}
               className="flex-1 py-3 rounded-xl items-center justify-center bg-amber-500/10 border border-amber-500/20"
             >
               <Text className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Mark Absent</Text>
             </TouchableOpacity>
           )}

           <TouchableOpacity 
             onPress={() => deleteRecord(item.id)}
             className="w-12 py-3 rounded-xl items-center justify-center bg-red-500/10 border border-red-500/20"
           >
             <Ionicons name="trash-outline" size={16} color="#ef4444" />
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-96" />
      
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            {navigation?.canGoBack?.() && (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10 mr-4"
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <View>
              <Text className="text-white text-3xl font-black italic tracking-tighter uppercase">Full Log</Text>
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-1">Attendance History</Text>
            </View>
          </View>
        </View>
      </View>

      {initialLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecords(true); }} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View className="mt-20 items-center">
               <Ionicons name="documents-outline" size={48} color="#1e293b" />
               <Text className="text-gray-500 font-bold mt-4">History log is empty</Text>
            </View>
          }
        />
      )}
    </View>
  );
};
