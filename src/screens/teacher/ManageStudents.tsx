import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView, Image } from 'react-native';
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

  // Attendance Modal State
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    // HODs can see everyone except other HODs, Teachers see students
    const query = supabase.from('profiles').select('*');
    
    if (currentUser?.role === 'TEACHER') {
      query.eq('role', 'STUDENT');
    } else {
      query.neq('id', currentUser?.id); // HOD sees everyone else
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
       Alert.alert('Update Failed', error.message);
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

  const openAttendanceModal = async (student: any) => {
    setEditingStudent(student);
    setAttendanceModalVisible(true);
    fetchStudentAttendance(student.id);
  };

  const fetchStudentAttendance = async (studentId: string) => {
    setLoadingAttendance(true);
    let query = supabase
      .from('attendance_logs')
      .select('*, class_schedules!inner(subject, teacher_id)')
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });
    
    if (currentUser?.role === 'TEACHER') {
       query = query.eq('class_schedules.teacher_id', currentUser.id);
    }
    
    const { data, error } = await query;
    if (!error) setStudentAttendance(data || []);
    setLoadingAttendance(false);
  };

  const updateStudentLog = async (logId: string, newStatus: string) => {
    setStudentAttendance(prev => prev.map(log => log.id === logId ? { ...log, status: newStatus } : log));
    const { data, error } = await supabase.from('attendance_logs').update({ status: newStatus }).eq('id', logId).select('id');
    if (error || !data || data.length === 0) Alert.alert('Update Failed', 'Missing Database RLS permissions for staff updates.');
  };

  const renderAttendanceLog = ({ item }: { item: any }) => (
    <View className="bg-white/5 p-4 rounded-3xl mb-3 border border-white/10">
      <View className="flex-row justify-between mb-2">
         <Text className="text-white font-black">{item.class_schedules?.subject}</Text>
         <Text className={`text-[10px] font-black uppercase ${item.status === 'PRESENT' ? 'text-emerald-500' : item.status === 'ABSENT' ? 'text-red-500' : 'text-amber-500'}`}>{item.status}</Text>
      </View>
      <Text className="text-gray-500 text-[10px] uppercase font-bold mb-3">{new Date(item.marked_at).toLocaleString()}</Text>
      <View className="flex-row gap-2">
         <TouchableOpacity onPress={() => updateStudentLog(item.id, 'PRESENT')} className="flex-1 py-2 bg-emerald-500/10 rounded-xl items-center border border-emerald-500/20">
            <Text className="text-emerald-500 text-[10px] font-black">PRESENT</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => updateStudentLog(item.id, 'ABSENT')} className="flex-1 py-2 bg-red-500/10 rounded-xl items-center border border-red-500/20">
            <Text className="text-red-500 text-[10px] font-black">ABSENT</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white/5 rounded-[40px] p-5 mb-4 border border-white/10 flex-row items-center">
      <View className="w-16 h-16 rounded-[28px] bg-indigo-500/10 items-center justify-center mr-4 border border-indigo-500/20 overflow-hidden">
        {item.face_ref_blob ? (
          <Image source={{ uri: `data:image/jpeg;base64,${item.face_ref_blob}` }} className="w-full h-full" />
        ) : (
          <Text className="text-indigo-400 font-black text-xl">{(item.full_name || item.email).slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-white font-black text-base" numberOfLines={1}>{item.full_name || 'Unregistered'}</Text>
        <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5" numberOfLines={1}>{item.email}</Text>
        <View className="flex-row items-center mt-2">
            <View className="bg-indigo-500/10 px-2 py-0.5 rounded-md mr-2">
                <Text className="text-indigo-400 text-[8px] font-black">{item.role}</Text>
            </View>
            <Text className={`text-[9px] font-black ${item.is_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
              {item.is_verified ? '✓ VERIFIED' : '⏰ PENDING'}
            </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity 
          onPress={() => openAttendanceModal(item)}
          className="w-10 h-10 rounded-xl bg-orange-500/10 items-center justify-center border border-orange-500/20"
        >
          <Ionicons name="document-text" size={18} color="#f97316" />
        </TouchableOpacity>
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
          <Ionicons name={item.is_verified ? "close-outline" : "checkmark-outline"} size={18} color={item.is_verified ? "#FBBF24" : "#10b981"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-96" />
      
      <View className="px-6 pt-16 pb-6 flex-row justify-between items-center">
        {navigation?.canGoBack?.() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : <View className="w-12 h-12" />}
        <View className="items-center">
          <Text className="text-white text-xl font-black italic tracking-tight uppercase">Identity Center</Text>
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Institutional Registry</Text>
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
              <Text className="text-white text-2xl font-black">Adjust Credentials</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView space-y-4 gap-4 showsVerticalScrollIndicator={false}>
              {editingStudent?.face_ref_blob && (
                 <View className="items-center mb-6">
                    <View className="w-32 h-32 rounded-[40px] border-2 border-indigo-500 overflow-hidden">
                       <Image source={{ uri: `data:image/jpeg;base64,${editingStudent.face_ref_blob}` }} className="w-full h-full" />
                    </View>
                    <Text className="text-gray-500 text-[10px] font-black uppercase mt-4 tracking-widest">Enrolled Identity</Text>
                 </View>
              )}

              <View className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Display Name</Text>
                <TextInput value={editedName} onChangeText={setEditedName} style={{color: '#fff'}} className="font-bold text-base" />
              </View>

              <View className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Phone Link</Text>
                <TextInput value={editedPhone} onChangeText={setEditedPhone} style={{color: '#fff'}} className="font-bold text-base" keyboardType="phone-pad" />
              </View>

              {currentUser?.role === 'HOD' && (
                <View className="mt-4">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Privilege Level</Text>
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
                className="mt-8 bg-indigo-500 py-6 rounded-[35px]"
              >
                {updating ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-black uppercase tracking-widest">Sync Changes</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => deleteUser(editingStudent.id)} className="mt-4 py-2">
                 <Text className="text-red-500/50 text-center font-bold text-xs">Remove Profile Internally</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attendance Modal */}
      <Modal visible={attendanceModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#0f172a] rounded-t-[50px] p-8 border-t border-white/10 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                 <Text className="text-white text-2xl font-black">Audit Record</Text>
                 <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">{editingStudent?.full_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {loadingAttendance ? (
               <View className="flex-1 justify-center items-center"><ActivityIndicator color="#6366f1" /></View>
            ) : (
               <FlatList
                 data={studentAttendance}
                 keyExtractor={i => i.id}
                 renderItem={renderAttendanceLog}
                 contentContainerStyle={{ paddingBottom: 40 }}
                 ListEmptyComponent={<Text className="text-gray-500 text-center mt-10 font-bold">No attendance logs available for this student in your classes.</Text>}
               />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
