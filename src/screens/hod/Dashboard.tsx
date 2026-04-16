import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const STAT_CARDS = [
  { label: 'Total Students', value: '—', icon: 'people-outline', color: '#6C63FF' },
  { label: 'Active Classes', value: '—', icon: 'book-outline', color: '#48CAE4' },
  { label: 'Departments', value: '—', icon: 'school-outline', color: '#F7971E' },
  { label: 'Reports', value: '—', icon: 'document-text-outline', color: '#34D399' },
];

const ADMIN_ACTIONS = [
  { label: 'Classes', screen: 'ManageClasses', icon: 'list-outline', colors: ['#6366f1', '#4f46e5'], desc: 'View and create sessions' },
  { label: 'Teachers', screen: 'ManageStaff', icon: 'people-outline', colors: ['#f59e0b', '#d97706'], desc: 'View and verify faculty' },
];

export const HoDDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'HO';

  return (
    <LinearGradient colors={['#0F0C29', '#1a1a3e', '#0F0C29']} className="flex-1">
      <ScrollView contentContainerStyle={{paddingBottom: 40}} className="px-5 pt-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-white text-2xl font-extrabold">Principal Console 🏛️</Text>
            <Text className="text-gray-500 text-xs font-semibold">{user?.email}</Text>
          </View>
          <View className="flex-row items-center space-x-2.5 gap-2.5">
            <View className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-500 items-center justify-center">
              <Text className="text-cyan-500 font-extrabold text-sm">{initials}</Text>
            </View>
            <TouchableOpacity onPress={logout} className="w-9 h-9 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Badge */}
        <View className="flex-row items-center bg-cyan-500/15 self-start px-3 py-1.5 rounded-full border border-cyan-500/30 mb-6">
          <Ionicons name="briefcase-outline" size={12} color="#48CAE4" className="mr-1.5" />
          <Text className="text-cyan-500 text-[10px] font-bold uppercase tracking-wider">Institution Admin</Text>
        </View>

        {/* Overview */}
        <Text className="text-white text-lg font-bold mb-4 tracking-tight">Overview</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3 mb-8">
          {STAT_CARDS.map((s) => (
            <View key={s.label} className="w-[48%] bg-white/5 rounded-3xl p-4 border border-white/10 shadow-sm">
              <View className="w-10 h-10 rounded-xl justify-center items-center mb-3" style={{ backgroundColor: `${s.color}20` }}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text className="text-white text-2xl font-black mb-0.5">{s.value}</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Administration */}
        <Text className="text-white text-lg font-bold mb-4 tracking-tight">Administration</Text>
        {ADMIN_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            onPress={() => navigation.navigate(a.screen)}
            activeOpacity={0.85}
            className="flex-row items-center bg-white/5 rounded-3xl mb-4 overflow-hidden border border-white/10 shadow-lg"
          >
            <LinearGradient colors={a.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-16 h-[76px] items-center justify-center">
              <Ionicons name={a.icon as any} size={24} color="#fff" />
            </LinearGradient>
            <View className="flex-1 px-4 py-3">
              <Text className="text-white text-sm font-bold mb-1">{a.label}</Text>
              <Text className="text-gray-500 text-[10px] font-medium leading-4">{a.desc}</Text>
            </View>
            <View className="pr-4">
              <Ionicons name="chevron-forward" size={18} color="#4B5563" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View className="rounded-3xl overflow-hidden mt-3 shadow-xl">
          <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(72,202,228,0.1)']} className="p-5 border border-indigo-500/20 rounded-3xl">
            <Ionicons name="analytics-outline" size={24} color="#6C63FF" className="mb-2" />
            <Text className="text-white text-base font-bold mb-2 tracking-tight">Analytics</Text>
            <Text className="text-gray-400 text-xs leading-5 font-medium">
              Comprehensive attendance reports across all departments will be available here.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};