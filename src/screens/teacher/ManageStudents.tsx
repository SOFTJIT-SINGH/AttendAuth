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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

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
    <View className="bg-slate-800/60 p-5 rounded-3xl mb-4 border border-slate-700/50">
      <View className="flex-row justify-between items-center mb-4">
         <View>
            <Text className="text-white font-black text-sm">{item.class_schedules?.subject || 'Direct Entry'}</Text>
            <Text className="text-slate-400 text-[9px] uppercase font-black tracking-[2px] mt-1">{new Date(item.marked_at).toLocaleString()}</Text>
         </View>
         <View className={`px-3 py-1.5 rounded-xl border ${item.status === 'PRESENT' ? 'bg-emerald-500/20 border-emerald-500/30' : item.status === 'ABSENT' ? 'bg-rose-500/20 border-rose-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
            <Text className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'PRESENT' ? 'text-emerald-400' : item.status === 'ABSENT' ? 'text-rose-400' : 'text-amber-400'}`}>{item.status}</Text>
         </View>
      </View>
      <View className="flex-row gap-3">
         <TouchableOpacity onPress={() => updateStudentLog(item.id, 'PRESENT')} className={`flex-1 py-3 rounded-2xl items-center border ${item.status === 'PRESENT' ? 'bg-emerald-500 border-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <Text className={`text-[10px] font-black tracking-[2px] ${item.status === 'PRESENT' ? 'text-white' : 'text-emerald-500'}`}>PRESENT</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => updateStudentLog(item.id, 'ABSENT')} className={`flex-1 py-3 rounded-2xl items-center border ${item.status === 'ABSENT' ? 'bg-rose-500 border-rose-400' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Text className={`text-[10px] font-black tracking-[2px] ${item.status === 'ABSENT' ? 'text-white' : 'text-rose-500'}`}>ABSENT</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white/5 rounded-[35px] p-5 mb-5 border border-white/10 overflow-hidden">
      <View className="flex-row items-center mb-5">
        <View className="w-14 h-14 rounded-[20px] bg-indigo-500/20 items-center justify-center mr-4 border border-indigo-500/40 overflow-hidden">
          {item.face_ref_blob ? (
            <Image source={{ uri: `data:image/jpeg;base64,${item.face_ref_blob}` }} className="w-full h-full" />
          ) : (
            <Text className="text-indigo-400 font-black text-xl">{(item.full_name || item.email).slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-lg tracking-tight" numberOfLines={1}>{item.full_name || 'Unregistered'}</Text>
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1" numberOfLines={1}>{item.email}</Text>
          <View className="flex-row items-center gap-2 mt-2">
              <View className={`px-2 py-1 rounded-md ${item.role === 'TEACHER' ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
                 <Text className={`text-[8px] font-black uppercase ${item.role === 'TEACHER' ? 'text-amber-400' : 'text-indigo-400'}`}>{item.role}</Text>
              </View>
              <View className={`px-2 py-1 rounded-md border ${item.is_verified ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <Text className={`text-[8px] font-black uppercase tracking-wider ${item.is_verified ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.is_verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 pt-4 border-t border-white/5">
        <TouchableOpacity onPress={() => openAttendanceModal(item)} className="flex-1 py-3 rounded-2xl bg-white/5 items-center justify-center border border-white/5">
          <View className="flex-row items-center">
            <Ionicons name="documents-outline" size={14} color="#a8a29e" />
            <Text className="text-stone-400 text-[10px] font-black ml-2 uppercase tracking-wide">Logs</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => openEditModal(item)} className="flex-1 py-3 rounded-2xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
          <View className="flex-row items-center">
             <Ionicons name="color-wand-outline" size={14} color="#818cf8" />
             <Text className="text-indigo-400 text-[10px] font-black ml-2 uppercase tracking-wide">Edit</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => toggleVerify(item.id, item.is_verified)} className={`flex-1 py-3 rounded-2xl items-center justify-center border ${item.is_verified ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <View className="flex-row items-center">
             <Ionicons name={item.is_verified ? "close-circle-outline" : "checkmark-circle-outline"} size={14} color={item.is_verified ? "#fb7185" : "#34d399"} />
             <Text className={`text-[10px] font-black ml-1.5 uppercase tracking-wide ${item.is_verified ? 'text-rose-400' : 'text-emerald-400'}`}>{item.is_verified ? 'Revoke' : 'Approve'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-96" />
      
      <View className="px-6 pt-16 pb-4">
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            {navigation?.canGoBack?.() && (
              <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10 mr-4">
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <View>
              <Text className="text-white text-3xl font-black italic tracking-tighter uppercase">Identities</Text>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mt-1">Registry Core</Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchStudents} className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
            <Ionicons name="sync" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 h-14">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor="#64748b"
            className="flex-1 text-white font-bold ml-3 h-full"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 12 }}
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
