import { View, Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export const HoDDashboard = () => {
  const { user } = useAuthStore();
  return (
    <View className="flex-1 bg-gray-900 p-6">
      <Text className="text-white text-2xl font-bold mb-2">HoD Dashboard</Text>
      <Text className="text-gray-400 mb-6">{user?.email}</Text>
      
      <View className="bg-gray-800 p-4 rounded-lg mb-4">
        <Text className="text-white font-bold mb-2">Quick Stats</Text>
        <Text className="text-gray-400">Total Students: 0</Text>
        <Text className="text-gray-400">Active Classes: 0</Text>
      </View>

      <View className="bg-gray-800 p-4 rounded-lg">
        <Text className="text-white font-bold mb-2">Admin Actions</Text>
        <Text className="text-gray-400">Use ManageClasses screen for CRUD operations.</Text>
      </View>
    </View>
  );
};