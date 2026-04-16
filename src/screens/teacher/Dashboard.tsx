import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const QUICK_CARDS = [
  {
    label: 'Pending Approvals',
    screen: 'Reports',
    icon: 'hourglass-outline',
    color: ['#F7971E', '#FFD200'] as [string, string],
    desc: 'Review face-verification requests',
  },
  {
    label: "Today's Classes",
    screen: 'Dashboard',
    icon: 'calendar-outline',
    color: ['#11998e', '#38ef7d'] as [string, string],
    desc: 'No sessions scheduled today',
    disabled: true,
  },
  {
    label: 'Manage Students',
    screen: 'ManageStudents',
    icon: 'people-outline',
    color: ['#6C63FF', '#48CAE4'] as [string, string],
    desc: 'Verify and manage student accounts',
  },
];

const STATS = [
  { label: 'Pending', value: '—', icon: 'hourglass-outline' },
  { label: 'Approved', value: '—', icon: 'checkmark-circle-outline' },
  { label: 'Classes', value: '—', icon: 'book-outline' },
];

export const TeacherDashboard = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'TC';

  return (
    <LinearGradient colors={['#070719', '#1a1a3e', '#070719']} className="flex-1">
      <ScrollView contentContainerStyle={{paddingBottom: 40}} className="px-5 pt-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-white text-2xl font-extrabold">Hello, Teacher 👨‍🏫</Text>
            <Text className="text-gray-500 text-xs font-semibold">{user?.email}</Text>
          </View>
          <View className="flex-row items-center space-x-2.5 gap-2.5">
            <View className="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-orange-500 items-center justify-center">
              <Text className="text-orange-500 font-extrabold text-sm">{initials}</Text>
            </View>
            <TouchableOpacity onPress={logout} className="w-9 h-9 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Badge */}
        <View className="flex-row items-center bg-orange-500/15 self-start px-3 py-1.5 rounded-full border border-orange-500/30 mb-6">
          <Ionicons name="person-outline" size={12} color="#F7971E" className="mr-1.5" />
          <Text className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">Teacher</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row space-x-2.5 gap-2.5 mb-7">
          {STATS.map((s) => (
            <View key={s.label} className="flex-1 bg-white/5 rounded-2xl p-3.5 items-center border border-white/10">
              <Ionicons name={s.icon as any} size={18} color="#F7971E" className="mb-1.5" />
              <Text className="text-white text-xl font-extrabold">{s.value}</Text>
              <Text className="text-gray-500 text-[10px] text-center font-medium">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions List */}
        <Text className="text-white text-lg font-bold mb-4 tracking-tight">Management</Text>
        {QUICK_CARDS.map((c) => (
          <TouchableOpacity
            key={c.label}
            onPress={() => !c.disabled && navigation.navigate(c.screen)}
            activeOpacity={c.disabled ? 1 : 0.85}
            className={`flex-row items-center bg-white/5 rounded-2xl mb-3 overflow-hidden border border-white/10 ${c.disabled ? 'opacity-50' : ''}`}
          >
            <LinearGradient colors={c.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-16 h-[72px] items-center justify-center shadow-lg">
              <Ionicons name={c.icon as any} size={24} color="#fff" />
            </LinearGradient>
            <View className="flex-1 px-4 py-3">
              <Text className="text-white text-sm font-bold mb-1">{c.label}</Text>
              <Text className="text-gray-500 text-[10px] font-medium leading-4">{c.desc}</Text>
            </View>
            {!c.disabled && (
              <View className="pr-3">
                <Ionicons name="chevron-forward" size={18} color="#4B5563" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};