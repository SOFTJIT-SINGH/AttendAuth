import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export const PendingVerificationScreen = () => {
  const { user, logout } = useAuthStore();

  return (
    <LinearGradient colors={['#0F0C29', '#302B63', '#24243E']} className="flex-1 justify-center items-center px-8">
      <View className="w-24 h-24 rounded-full bg-amber-500/15 border-2 border-amber-500/30 justify-center items-center mb-6">
        <Ionicons name="time-outline" size={48} color="#FBBF24" />
      </View>
      
      <Text className="text-white text-3xl font-extrabold text-center mb-2">Review Pending</Text>
      <Text className="text-gray-400 text-base text-center leading-6 mb-10">
        Your account ({user?.email}) is currently under review by the authorities. {'\n\n'}
        Please contact your {user?.role === 'TEACHER' ? 'HOD' : 'Teacher'} for approval.
      </Text>

      <TouchableOpacity 
        onPress={logout}
        activeOpacity={0.85}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 items-center"
      >
        <Text className="text-white font-bold text-base">Sign Out</Text>
      </TouchableOpacity>
      
      <View className="mt-8 flex-row items-center">
        <ActivityIndicator size="small" color="#FBBF24" className="mr-2" />
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Checking status periodially...</Text>
      </View>
    </LinearGradient>
  );
};

import { ActivityIndicator } from 'react-native';
