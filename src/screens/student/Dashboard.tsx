import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export const StudentDashboard = ({ navigation }: any) => {
  const { user } = useAuthStore();
  return (
    <View className="flex-1 bg-gray-900 p-6 items-center justify-center">
      <Text className="text-white text-2xl font-bold mb-4">Student Dashboard</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Mark')} className="bg-blue-600 w-full p-4 rounded">
        <Text className="text-white text-center font-bold">Mark Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};