import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export const ManageStudents = ({ navigation }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT');
    if (error) Alert.alert('Error', error.message);
    else setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleVerify = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !current })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchStudents();
  };

  const deleteUser = async (id: string) => {
    Alert.alert('Remove Student', 'This user will be removed from the class list. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else fetchStudents();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white/5 rounded-3xl p-4 mb-3 border border-white/10 flex-row items-center">
      <View className="w-12 h-12 rounded-2xl bg-orange-500/20 items-center justify-center mr-4">
        <Text className="text-orange-500 font-bold">{item.email.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>{item.email}</Text>
        <Text className={`text-[10px] font-bold ${item.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
          {item.is_verified ? 'VERIFIED' : 'PENDING APPROVAL'}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity 
          onPress={() => toggleVerify(item.id, item.is_verified)}
          className={`w-10 h-10 rounded-xl items-center justify-center ${item.is_verified ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}
        >
          <Ionicons name={item.is_verified ? "close-circle-outline" : "checkmark-circle-outline"} size={22} color={item.is_verified ? "#FBBF24" : "#34D399"} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteUser(item.id)}
          className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={20} color="#F87171" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#070719', '#1a1a3e', '#070719']} className="flex-1">
      <View className="px-5 pt-14 pb-5 flex-row justify-between items-center border-b border-white/10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">Manage Students</Text>
          <Text className="text-gray-500 text-[10px] font-bold uppercase">Class Roster</Text>
        </View>
        <TouchableOpacity onPress={fetchStudents} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <Ionicons name="refresh-outline" size={20} color="#F7971E" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F7971E" className="mt-20" />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-20">No students registered.</Text>
          }
        />
      )}
    </LinearGradient>
  );
};
