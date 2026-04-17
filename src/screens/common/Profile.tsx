import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' }
    ]);
  };

  const INFO_ITEMS = [
    { label: 'Email Address', value: user?.email, icon: 'mail-outline' },
    { label: 'Phone Number', value: user?.phone || 'Not linked', icon: 'call-outline' },
    { label: 'Device Identifier', value: user?.device_id?.slice(0, 16) + '...', icon: 'hardware-chip-outline' },
    { label: 'Verified Status', value: user?.is_verified ? 'Verified Account' : 'Pending Verification', icon: 'shield-checkmark-outline', color: user?.is_verified ? '#10b981' : '#f59e0b' },
  ];

  return (
    <View className="flex-1 bg-[#020617]">
      <View className="absolute top-0 w-full h-[50%] opacity-10">
        <LinearGradient colors={['#6366f1', 'rgba(0,0,0,0)']} className="flex-1" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-16">
        {/* Profile Card */}
        <View className="items-center mb-10">
          <View className="w-28 h-28 items-center justify-center">
            <View className="absolute inset-0 bg-indigo-500 rounded-[40px] opacity-20 rotate-12" />
            <View className="w-24 h-24 bg-white/10 rounded-[35px] border border-white/20 items-center justify-center shadow-2xl backdrop-blur-3xl">
              <Text className="text-white text-3xl font-black">
                {(user?.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            {user?.is_verified && (
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#020617] items-center justify-center">
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          
          <Text className="text-white text-2xl font-black mt-6 tracking-tight">
            {user?.full_name || 'Anonymous'}
          </Text>
          <Text className="text-gray-500 text-[10px] font-black tracking-[4px] uppercase mt-1">
            {user?.role} ACCOUNT
          </Text>
          <View className="bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 mt-2">
            <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[3px]">Authorized Access</Text>
          </View>
        </View>

        {/* Credentials Section */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mb-4 px-2">Account Credentials</Text>
        <View className="bg-white/5 rounded-[40px] border border-white/10 p-6 space-y-4 gap-4">
          {INFO_ITEMS.map((item, index) => (
            <View key={index} className="flex-row items-center p-4 bg-white/5 rounded-3xl border border-white/5">
              <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-4">
                <Ionicons name={item.icon as any} size={18} color={item.color || '#6366f1'} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{item.label}</Text>
                <Text style={{ color: item.color || '#fff' }} className="text-sm font-bold mt-0.5">{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Section */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-10 mb-4 px-2">Session Actions</Text>
        <View className="space-y-3 gap-3">
          <TouchableOpacity onPress={() => navigation.navigate('Support')} className="flex-row items-center p-5 bg-white/5 rounded-[30px] border border-white/10 mb-2">
            <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-4">
              <Ionicons name="help-buoy" size={18} color="#6366f1" />
            </View>
            <Text className="text-white font-bold flex-1">Help & Support Center</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-5 bg-red-500/5 rounded-[30px] border border-red-500/10">
            <View className="w-10 h-10 rounded-2xl bg-red-500/10 items-center justify-center mr-4">
              <Ionicons name="power" size={18} color="#ef4444" />
            </View>
            <Text className="text-red-500 font-bold flex-1">Sign Out of Session</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View className="mt-12 items-center">
          <Text className="text-gray-600 text-[10px] font-medium italic">Version 1.0.4 Premium Alpha</Text>
        </View>
      </ScrollView>
    </View>
  );
};
