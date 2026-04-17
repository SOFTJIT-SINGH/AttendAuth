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
    try {
      const { error } = await supabase
        .from('attendance_logs')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      Alert.alert('Status Updated', `Log has been moved to ${newStatus.toLowerCase()} records.`);
      fetchRecords();
    } catch (e: any) {
       Alert.alert('Modification Failed', e.message);
    }
  };

  const deleteRecord = async (id: string) => {
    Alert.alert('Erase Audit Log', 'This action will permanently delete this attendance record from the database. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('attendance_logs').delete().eq('id', id);
        if (error) Alert.alert('Deletion Failed', error.message);
        else {
          Alert.alert('Log Erased', 'The attendance record has been wiped.');
          fetchRecords();
        }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const confidence = item.ai_confidence != null ? Math.round(item.ai_confidence) : null;
    const confColor = confidence == null ? '#94a3b8' : confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444';
    const distance = item.distance_km != null ? item.distance_km : null;
    const distanceText = distance != null ? (distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`) : 'N/A';
    const isOutRange = distance != null && distance > 0.6; // 600m threshold

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
            <View className={`px-2 py-1 rounded-lg ${item.status === 'PRESENT' ? 'bg-emerald-500/10 border border-emerald-500/20' : item.status === 'ABSENT' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <Text className={`text-[8px] font-black uppercase ${item.status === 'PRESENT' ? 'text-emerald-500' : item.status === 'ABSENT' ? 'text-red-500' : 'text-amber-500'}`}>
                {item.status ? String(item.status).replace('_', ' ') : 'UNKNOWN'}
              </Text>
            </View>
            <Text className="text-gray-600 text-[8px] font-bold mt-2">{new Date(item.marked_at).toLocaleTimeString()}</Text>
          </View>
        </View>

        {/* Audit Data Panel */}
        <View className="flex-row gap-2 mb-6">
           <View className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Text className="text-gray-600 text-[8px] font-black uppercase tracking-widest mb-1 text-center">Identity Match</Text>
              <Text style={{ color: confColor }} className="text-sm font-black text-center">{confidence || 0}%</Text>
           </View>
           <View className={`flex-1 ${isOutRange ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'} p-3 rounded-2xl border`}>
              <Text className="text-gray-600 text-[8px] font-black uppercase tracking-widest mb-1 text-center">Distance Log</Text>
              <Text className={`${isOutRange ? 'text-red-500' : 'text-white'} text-sm font-black text-center`}>{distanceText}</Text>
           </View>
        </View>

        {confidence !== null && (
          <View className="h-1 bg-white/5 rounded-full overflow-hidden mb-8">
              <View className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: confColor }} />
          </View>
        )}

        {/* Dynamic Controls */}
        <View className="flex-row gap-2 mt-4">
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
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            {navigation.canGoBack() && (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10 mr-4"
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
            )}
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