import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export const TeacherDashboard = ({ navigation }: any) => {
  const { user } = useAuthStore();
  return (
    <View className="flex-1 bg-gray-900 p-6 items-center justify-center">
      <Text className="text-white text-2xl font-bold mb-2">Teacher Dashboard</Text>
      <Text className="text-gray-400 mb-8">{user?.email}</Text>
      
      <TouchableOpacity onPress={() => navigation.navigate('Reports')} className="bg-green-600 w-full p-4 rounded-lg mb-4">
        <Text className="text-white text-center font-bold text-lg">Pending Approvals</Text>
      </TouchableOpacity>
      
      <View className="bg-gray-800 w-full p-4 rounded-lg">
        <Text className="text-white font-bold mb-2">Today&apos;s Classes</Text>
        <Text className="text-gray-400">No active sessions scheduled.</Text>
      </View>
    </View>
  );
};