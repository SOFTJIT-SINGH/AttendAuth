import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export const StudentDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, pending: 0, lastWeek: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('status, marked_at')
        .eq('student_id', user.id);

      if (data) {
        const total = data.filter(r => r.status === 'PRESENT').length;
        const pending = data.filter(r => r.status === 'PENDING_APPROVAL').length;

        // Count last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const lastWeek = data.filter(r => new Date(r.marked_at) > weekAgo && r.status === 'PRESENT').length;

        setStats({ total, pending, lastWeek });
      }
    } catch (e) {
      console.error('Stats Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh when screen is focused would be better, but standard useEffect handles mount.
    const unsubscribe = navigation.addListener('focus', fetchStats);
    return unsubscribe;
  }, [navigation]);

  return (
    <View className="flex-1 bg-[#020617]">
      {/* Absolute background accent */}
      <View className="absolute top-0 w-full h-80 opacity-10">
        <LinearGradient colors={['#6366f1', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-16" showsVerticalScrollIndicator={false}>
        {/* Profile / Header */}
        <View className="flex-row justify-between items-center mb-10">
          <View>
            {/* <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mb-1">Authenticated</Text> */}
            <Text className="text-white text-3xl font-black tracking-tight">Student Dashboard</Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-1">{user?.full_name || 'Student'}</Text>

          </View>
          <TouchableOpacity onPress={logout} className="w-12 h-12 rounded-[20px] bg-red-500/10 items-center justify-center border border-red-500/20">
            <Ionicons name="power" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Dynamic Stats Cards */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-4 px-1">My Progress</Text>
        <View className="flex-row space-x-3 gap-3 mb-10">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-[30px] p-5">
            <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-2">Total</Text>
            {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text className="text-white text-3xl font-black">{stats.total}</Text>}
            <Text className="text-emerald-500 text-[8px] font-bold uppercase mt-1">Present</Text>
          </View>
          <View className="flex-1 bg-white/5 border border-white/10 rounded-[30px] p-5">
            <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-2">Pending</Text>
            {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text className="text-white text-3xl font-black">{stats.pending}</Text>}
            <Text className="text-amber-500 text-[8px] font-bold uppercase mt-1">Waiting</Text>
          </View>
          <View className="flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded-[30px] p-5">
            <Text className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2">Last 7 Days</Text>
            {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text className="text-white text-3xl font-black">{stats.lastWeek}</Text>}
            <Text className="text-indigo-400 text-[8px] font-bold uppercase mt-1">This Week</Text>
          </View>
        </View>

        {/* Navigation Actions */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-4 px-1">Options</Text>
        <View className="space-y-4 gap-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('Mark')}
            activeOpacity={0.9}
            className="bg-white/5 border border-white/10 p-6 rounded-[35px] flex-row items-center"
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-lg shadow-indigo-500/50">
              <Ionicons name="camera-outline" size={28} color="#fff" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-white text-lg font-black tracking-tight">Tap to Check-In</Text>
              <Text className="text-gray-500 text-xs font-medium">Scan your face</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4b5563" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.9}
            className="bg-white/5 border border-white/10 p-6 rounded-[35px] flex-row items-center"
          >
            <View className="w-14 h-14 bg-white/5 rounded-2xl items-center justify-center mr-4 border border-white/10">
              <Ionicons name="list-outline" size={28} color="#94a3b8" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-black tracking-tight">Attendance Record</Text>
              <Text className="text-gray-400 text-xs font-medium">View your past logs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View className="mt-10 p-6 bg-slate-900 rounded-[35px] border border-slate-800 items-center">
          <Text className="text-gray-500 text-[9px] font-black uppercase tracking-[4px] mb-1">Session ID</Text>
          <Text className="text-gray-400 text-[10px] font-mono">{user?.id}</Text>
        </View>
      </ScrollView>
    </View>
  );
};