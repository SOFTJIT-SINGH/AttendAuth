import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';

export const TeacherDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ pending: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTeacherStats = async () => {
    if (!user) return;
    try {
      const { count: pending } = await supabase.from('attendance_logs').select('*, class_schedules!inner(teacher_id)', { count: 'exact', head: true }).eq('status', 'PENDING_APPROVAL').eq('class_schedules.teacher_id', user.id);
      const { count: classes } = await supabase.from('class_schedules').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id);
      setStats({ pending: pending || 0, classes: classes || 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeacherStats();
    } else {
      setLoading(false);
    }
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) fetchTeacherStats();
    });
    return unsubscribe;
  }, [navigation, user?.id]);

  const ACTIONS = [
    { label: 'Pending Approvals', screen: 'Registry', icon: 'hourglass-outline', colors: ['#f59e0b', '#d97706'] as const, count: stats.pending },
    { label: 'Full Attendance Logs', screen: 'History', icon: 'documents-outline', colors: ['#8b5cf6', '#6d28d9'] as const, count: null },
    { label: 'Manage Classes', screen: 'ManageClasses', icon: 'calendar-outline', colors: ['#06b6d4', '#0891b2'] as const, count: stats.classes },
    { label: 'Manage Students', screen: 'ManageStudents', icon: 'people-outline', colors: ['#6366f1', '#4f46e5'] as const, count: null },
  ];

  return (
    <View className="flex-1 bg-[#020617]">
      <View className="absolute top-0 w-full h-80 opacity-10">
        <LinearGradient colors={['#f59e0b', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-16">
        <View className="flex-row justify-between items-center mb-10">
          <View>
            {/* <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mb-1">Administrative</Text> */}
            <Text className="text-white text-3xl font-black tracking-tight">Teacher Dashboard</Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-1">{user?.full_name || 'Teacher'}</Text>

          </View>
          <TouchableOpacity onPress={logout} className="w-12 h-12 rounded-[20px] bg-red-500/10 items-center justify-center border border-red-500/20">
            <Ionicons name="power" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-4 px-1">Management Suite</Text>
        <View className="space-y-4 gap-4">
          {ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.9}
              className="bg-white/5 border border-white/10 p-5 rounded-[35px] flex-row items-center"
            >
              <LinearGradient colors={action.colors} className="w-14 h-14 rounded-2xl items-center justify-center mr-4">
                <Ionicons name={action.icon as any} size={26} color="#fff" />
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-white text-lg font-black tracking-tight">{action.label}</Text>
                <Text className="text-gray-500 text-xs font-medium">Click to manage</Text>
              </View>
              {action.count !== null && (
                <View className="bg-white/10 px-3 py-1 rounded-full border border-white/10 mr-2">
                  <Text className="text-white text-[10px] font-black">{action.count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#4b5563" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-10 p-6 bg-slate-900 rounded-[35px] border border-slate-800 flex-row items-center">
          <View className="bg-amber-500/10 p-3 rounded-2xl mr-4">
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
          </View>
          <Text className="text-gray-400 text-xs flex-1 font-medium leading-5">You can now create and manage your own class sessions directly from the Dashboard.</Text>
        </View>
      </ScrollView>
    </View>
  );
};