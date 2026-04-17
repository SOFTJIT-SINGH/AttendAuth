import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';

export const TeacherReports = () => {
  const navigation = useNavigation<any>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance_logs')
        .select(`
          *,
          profiles:student_id (
            email,
            full_name
          ),
          class_schedules:class_id (
            subject
          )
        `)
        .order('marked_at', { ascending: false });

      if (activeTab === 'PENDING') {
        query = query.eq('status', 'PENDING_APPROVAL');
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (e: any) {
      Alert.alert('Fetch Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('attendance_logs')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
       Alert.alert('Update Failed', error.message);
    } else {
       fetchRecords();
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const confidence = item.ai_confidence != null ? Math.round(item.ai_confidence) : null;
    const confColor = confidence == null ? '#94a3b8' : confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444';
    
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
              {item.class_schedules?.subject || 'General Session'}
            </Text>
          </View>
          <View className="items-end">
            <View className={`px-2 py-1 rounded-lg ${item.status === 'PRESENT' ? 'bg-emerald-500/10 border border-emerald-500/20' : item.status === 'ABSENT' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <Text className={`text-[8px] font-black uppercase ${item.status === 'PRESENT' ? 'text-emerald-500' : item.status === 'ABSENT' ? 'text-red-500' : 'text-amber-500'}`}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
            <Text className="text-gray-600 text-[8px] font-bold mt-2">{new Date(item.marked_at).toLocaleTimeString()}</Text>
          </View>
        </View>

        {confidence !== null && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Biometric Match</Text>
              <Text style={{ color: confColor }} className="text-[10px] font-black">{confidence}%</Text>
            </View>
            <View className="h-1 bg-white/5 rounded-full overflow-hidden">
               <View className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: confColor }} />
            </View>
          </View>
        )}

        <View className="flex-row gap-2">
           {item.status !== 'PRESENT' && (
             <TouchableOpacity 
               onPress={() => updateStatus(item.id, 'PRESENT')}
               className="flex-1 bg-emerald-500 py-3 rounded-2xl items-center justify-center"
             >
               <Text className="text-white font-black text-[10px] uppercase tracking-widest">Mark Present</Text>
             </TouchableOpacity>
           )}
           {item.status !== 'ABSENT' && (
             <TouchableOpacity 
               onPress={() => updateStatus(item.id, 'ABSENT')}
               className="flex-1 bg-red-500/10 border border-red-500/20 py-3 rounded-2xl items-center justify-center"
             >
               <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest">Mark Absent</Text>
             </TouchableOpacity>
           )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-96" />
      
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10 mr-4"
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-3xl font-black italic tracking-tighter uppercase">Registry</Text>
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-1">Attendance Audit</Text>
            </View>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center">
            <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-white/5 p-1.5 rounded-[22px] border border-white/10">
          <TouchableOpacity 
            onPress={() => setActiveTab('PENDING')}
            className={`flex-1 py-3 items-center rounded-2xl ${activeTab === 'PENDING' ? 'bg-indigo-500 shadow-xl' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'PENDING' ? 'text-white' : 'text-gray-500'}`}>Approvals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('HISTORY')}
            className={`flex-1 py-3 items-center rounded-2xl ${activeTab === 'HISTORY' ? 'bg-indigo-500 shadow-xl' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'HISTORY' ? 'text-white' : 'text-gray-500'}`}>Full Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecords(); }} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Ionicons name="document-text-outline" size={48} color="#1e293b" />
              <Text className="text-gray-500 font-bold mt-4">No records in this queue</Text>
            </View>
          }
        />
      )}
    </View>
  );
};