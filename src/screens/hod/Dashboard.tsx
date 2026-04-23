import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';

export const HoDDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    reports: 0
  });

  const fetchData = async () => {
    try {
      // Fetch only necessary counts
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'STUDENT');

      const { count: reportCount } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true });

      setStats({
        students: studentCount || 0,
        reports: reportCount || 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const STAT_CARDS = [
    { label: 'Total Students', value: stats.students.toString(), icon: 'people-outline', color: '#6366f1', screen: 'ManageStudents' },
    { label: 'Attendance Logs', value: stats.reports.toString(), icon: 'document-text-outline', color: '#10b981', screen: 'Registry' },
  ];

  const ADMIN_ACTIONS = [
    { label: 'Identity Center', screen: 'ManageStudents', icon: 'finger-print-outline', colors: ['#6366f1', '#4f46e5'] as const, desc: 'Manage Students & Roles' },
    { label: 'Staff Registry', screen: 'ManageStaff', icon: 'people-outline', colors: ['#f59e0b', '#d97706'] as const, desc: 'Faculty Verification' },
    { label: 'Class Scheduler', screen: 'ManageClasses', icon: 'calendar-outline', colors: ['#0ea5e9', '#0284c7'] as const, desc: 'Global Sessions List' },
  ];

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('') || 'HO';

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-[400px]" />
      
      <ScrollView 
        contentContainerStyle={{paddingBottom: 40}} 
        className="px-6 pt-16" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Simplified Header */}
        <View className="flex-row justify-between items-center mb-10">
          <View>
            <Text className="text-white text-3xl font-black italic tracking-tighter uppercase">HOD Dashboard</Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-1">{user?.full_name || 'HOD'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('HProfile')} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <Text className="text-indigo-400 font-black text-xs">{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Essential Stats Only */}
        <View className="flex-row justify-between gap-4 mb-10">
          {STAT_CARDS.map((s) => (
            <TouchableOpacity 
              key={s.label} 
              onPress={() => navigation.navigate(s.screen)}
              activeOpacity={0.7}
              className="flex-1 bg-white/5 rounded-[40px] p-6 border border-white/10"
            >
              <View className="w-12 h-12 rounded-2xl justify-center items-center mb-6" style={{ backgroundColor: `${s.color}15` }}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
              </View>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text className="text-white text-3xl font-black tracking-tighter mb-1">{s.value}</Text>
              )}
              <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Administration Actions */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mb-6 px-2">Management</Text>
        <View className="gap-y-4">
          {ADMIN_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.8}
              className="flex-row items-center bg-white/5 rounded-[40px] p-2 overflow-hidden border border-white/10"
            >
              <LinearGradient colors={a.colors} className="w-16 h-16 rounded-[32px] items-center justify-center">
                <Ionicons name={a.icon as any} size={24} color="#fff" />
              </LinearGradient>
              <View className="flex-1 px-5">
                <Text className="text-white text-base font-black italic">{a.label}</Text>
                <Text className="text-gray-500 text-[10px] font-bold mt-0.5">{a.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4B5563" style={{ marginRight: 20 }} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={logout} className="mt-10 py-5 rounded-[40px] border border-red-500/10 bg-red-500/5 items-center justify-center">
           <Text className="text-red-500 font-black uppercase tracking-[3px] text-xs">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};