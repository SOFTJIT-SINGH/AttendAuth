import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const QUICK_ACTIONS = [
  { label: 'Mark Attendance', screen: 'Mark', icon: 'camera', color: ['#6C63FF', '#48CAE4'] as [string,string] },
  { label: 'View History', screen: 'History', icon: 'time', color: ['#11998e', '#38ef7d'] as [string,string] },
];

const STATS = [
  { label: 'This Week', value: '—', icon: 'calendar-outline' },
  { label: 'Total', value: '—', icon: 'checkmark-circle-outline' },
  { label: 'Pending', value: '—', icon: 'hourglass-outline' },
];

export const StudentDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'ST';

  return (
    <LinearGradient colors={['#0F0C29', '#1a1a3e', '#0F0C29']} className="flex-1">
      <ScrollView contentContainerStyle={{paddingBottom: 40}} className="px-5 pt-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-white text-2xl font-extrabold">Good Day 👋</Text>
            <Text className="text-gray-500 text-xs font-semibold">{user?.email}</Text>
          </View>
          <View className="flex-row items-center space-x-2.5 gap-2.5">
            <View className="w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-500 items-center justify-center">
              <Text className="text-indigo-500 font-extrabold text-sm">{initials}</Text>
            </View>
            <TouchableOpacity onPress={logout} className="w-9 h-9 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Badge */}
        <View className="flex-row items-center bg-indigo-500/15 self-start px-3 py-1.5 rounded-full border border-indigo-500/30 mb-6">
          <Ionicons name="school-outline" size={12} color="#6C63FF" className="mr-1.5" />
          <Text className="text-indigo-500 text-[10px] font-bold uppercase tracking-wider">Student</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row space-x-2.5 gap-2.5 mb-7">
          {STATS.map((s) => (
            <View key={s.label} className="flex-1 bg-white/5 rounded-2xl p-3.5 items-center border border-white/10">
              <Ionicons name={s.icon as any} size={18} color="#6C63FF" className="mb-1.5" />
              <Text className="text-white text-xl font-extrabold">{s.value}</Text>
              <Text className="text-gray-500 text-[10px] text-center font-medium">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text className="text-white text-lg font-bold mb-3.5 tracking-tight">Quick Actions</Text>
        <View className="flex-row space-x-3 gap-3 mb-6">
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.screen}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.85}
              className="flex-1 rounded-3xl overflow-hidden shadow-xl"
            >
              <LinearGradient colors={a.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5 min-h-[140px] justify-between">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                  <Ionicons name={a.icon as any} size={24} color="#fff" />
                </View>
                <View>
                  <Text className="text-white text-sm font-bold">{a.label}</Text>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" className="mt-2" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Banner */}
        <View className="flex-row items-start bg-cyan-400/10 rounded-2xl p-4 border border-cyan-400/20">
          <Ionicons name="information-circle-outline" size={20} color="#48CAE4" className="mr-2.5" />
          <View className="flex-1">
            <Text className="text-cyan-400 font-bold text-sm mb-1">Attendance Reminder</Text>
            <Text className="text-gray-400 text-xs leading-5">
              Ensure you are within the classroom geofence before marking attendance.
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};