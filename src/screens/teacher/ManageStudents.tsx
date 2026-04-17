import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export const ManageStudents = ({ navigation }: any) => {
  const { user: currentUser } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    // HODs can see everyone except other HODs, Teachers see students
    const query = supabase.from('profiles').select('*');
    
    if (currentUser?.role === 'TEACHER') {
      await query.eq('role', 'STUDENT');
    } else {
      await query.neq('id', currentUser?.id); // HOD sees everyone else
    }

    const { data, error } = await query;
    if (error) Alert.alert('Error', error.message);
    else setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setEditedName(student.full_name || '');
    setEditedPhone(student.phone || '');
    setEditedRole(student.role);
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingStudent) return;
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedName.trim(),
        phone: editedPhone.trim(),
        role: editedRole
      })
      .eq('id', editingStudent.id);

    if (error) {
       Alert.alert('Update Failed', error.message + '\n\nEnsure you have run the RLS hierarchy SQL commands in Supabase.');
    } else {
       Alert.alert('Success', 'Profile updated successfully.');
       setEditModalVisible(false);
       fetchStudents();
    }
    setUpdating(false);
  };

  const toggleVerify = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !current })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchStudents();
  };

  const deleteUser = async (id: string) => {
    Alert.alert('Remove User', 'This user will be permanently removed from the system. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else fetchStudents();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white/5 rounded-3xl p-5 mb-4 border border-white/10 flex-row items-center">
      <View className="w-14 h-14 rounded-[20px] bg-indigo-500/10 items-center justify-center mr-4 border border-indigo-500/20">
        <Text className="text-indigo-400 font-black text-lg">{(item.full_name || item.email).slice(0, 1).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-black text-base" numberOfLines={1}>{item.full_name || 'No Name'}</Text>
        <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{item.role}</Text>
        <Text className={`text-[10px] font-black mt-1 ${item.is_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
          {item.is_verified ? '✓ VERIFIED' : '⏰ PENDING'}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity 
          onPress={() => openEditModal(item)}
          className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
        >
          <Ionicons name="create-outline" size={18} color="#6366f1" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => toggleVerify(item.id, item.is_verified)}
          className={`w-10 h-10 rounded-xl items-center justify-center ${item.is_verified ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}
        >
          <Ionicons name={item.is_verified ? "close" : "checkmark"} size={18} color={item.is_verified ? "#FBBF24" : "#10b981"} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteUser(item.id)}
          className="w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-96" />
      
      <View className="px-6 pt-16 pb-6 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-xl font-black italic tracking-tight">Identity Center</Text>
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Manage Profiles</Text>
        </View>
        <TouchableOpacity onPress={fetchStudents} className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Ionicons name="people-outline" size={48} color="#1e293b" />
              <Text className="text-gray-500 font-bold mt-4">No profiles found.</Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#0f172a] rounded-t-[50px] p-10 border-t border-white/10">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-2xl font-black">Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView space-y-4 gap-4>
              <View className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Full Name</Text>
                <TextInput value={editedName} onChangeText={setEditedName} style={{color: '#fff'}} className="font-bold text-base" />
              </View>

              <View className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Phone Number</Text>
                <TextInput value={editedPhone} onChangeText={setEditedPhone} style={{color: '#fff'}} className="font-bold text-base" keyboardType="phone-pad" />
              </View>

              {currentUser?.role === 'HOD' && (
                <View className="mt-4">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Assign Role</Text>
                  <View className="flex-row gap-2">
                    {['STUDENT', 'TEACHER', 'HOD'].map(r => (
                      <TouchableOpacity 
                        key={r} 
                        onPress={() => setEditedRole(r)}
                        className={`flex-1 py-3 rounded-2xl border ${editedRole === r ? 'bg-indigo-500/20 border-indigo-500' : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-center text-[10px] font-black ${editedRole === r ? 'text-white' : 'text-gray-500'}`}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity 
                onPress={handleUpdate} 
                disabled={updating}
                className="mt-10 bg-indigo-500 py-5 rounded-[30px] shadow-2xl shadow-indigo-500/50"
              >
                {updating ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-black uppercase tracking-widest">Commit Changes</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
