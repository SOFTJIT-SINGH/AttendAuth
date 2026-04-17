import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ClassListScreen = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          teacher:profiles(id, email, full_name)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const renderClassItem = ({ item }: { item: any }) => (
    <View className="mb-4 bg-white/5 border border-white/10 rounded-[30px] overflow-hidden">
      <LinearGradient 
        colors={['rgba(255,255,255,0.03)', 'transparent']} 
        className="p-6"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-white text-xl font-black tracking-tight">{item.subject}</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="person-circle-outline" size={14} color="#818cf8" />
              <Text className="text-gray-400 text-xs ml-1 font-bold">
                Prof. {item.teacher?.full_name || item.teacher?.email?.split('@')[0] || 'Unknown'}
              </Text>
            </View>
          </View>
          <View className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Active</Text>
          </View>
        </View>

        <View className="flex-row space-x-6 gap-6 pt-4 border-t border-white/5">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text className="text-gray-300 text-xs ml-2 font-black">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text className="text-gray-300 text-xs ml-2 font-black">Zone {item.geofence_radius_m}m</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient 
        colors={['#6366f120', 'transparent']} 
        className="absolute top-0 left-0 right-0 h-96" 
      />
      
      <SafeAreaView className="flex-1 px-6">
        <View className="mt-8 mb-10">
          <Text className="text-white text-4xl font-black italic tracking-tighter">Academic</Text>
          <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[5px] mt-2">Class Schedules</Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={classes}
            renderItem={renderClassItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                <Ionicons name="file-tray-outline" size={48} color="#1e293b" />
                <Text className="text-gray-500 font-bold mt-4">No classes scheduled yet</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};
