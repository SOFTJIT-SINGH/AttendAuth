import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';

export const PendingVerificationScreen = () => {
  const { user, logout, setSession } = useAuthStore();
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data?.is_verified) {
        setSession(data as UserProfile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setChecking(false), 2000);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkStatus, 15000); // Auto check every 15s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-[#020617]">
      {/* Background Ambience */}
      <View className="absolute inset-0">
        <View className="absolute top-[10%] right-[-20%] w-[80%] h-[40%] rounded-full opacity-20 blur-[120px] bg-indigo-600" />
        <View className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[40%] rounded-full opacity-10 blur-[120px] bg-sky-600" />
      </View>

      <View className="flex-1 px-10 justify-center items-center">
        {/* Animated-like Icon Container */}
        <View className="w-32 h-32 mb-10 items-center justify-center">
          <View className="absolute inset-0 rounded-[40px] border-2 border-indigo-500/20 rotate-45" />
          <View className="absolute inset-2 rounded-[35px] border border-indigo-500/10 -rotate-12" />
          <View className="w-20 h-20 bg-indigo-500/10 rounded-3xl items-center justify-center border border-indigo-500/30">
            <Ionicons name="shield-checkmark" size={40} color="#818cf8" />
          </View>
        </View>

        <Text className="text-white text-3xl font-black text-center tracking-tight">System Verification</Text>
        <View className="h-1 w-12 bg-indigo-500 rounded-full my-6" />
        
        <Text className="text-gray-400 text-base text-center leading-7 px-4">
          Greetings, <Text className="text-white font-bold">{user?.full_name || user?.email?.split('@')[0]}</Text>. Your credentials have been received and are currently being audited by the departmental authorities.
        </Text>

        <View className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full mt-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Verification Status</Text>
            <View className="px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Text className="text-amber-500 text-[8px] font-black uppercase">Pending Approval</Text>
            </View>
          </View>
          
          <View className="space-y-3 gap-3">
             <StatusGate label="Identity Documents" completed />
             <StatusGate label="Institutional Affiliation" completed={user?.role !== 'STUDENT'} />
             <StatusGate label="Biometric Reference" completed={!!user?.face_ref_blob} />
             <StatusGate label="Final Administrative Sign-off" completed={false} last />
          </View>
        </View>

        <TouchableOpacity 
          onPress={checkStatus}
          disabled={checking}
          className="mt-12 group"
        >
          {checking ? (
            <ActivityIndicator color="#818cf8" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="refresh-outline" size={16} color="#6366f1" />
              <Text className="text-indigo-400 ml-2 font-black text-[10px] uppercase tracking-[3px]">Refresh Status</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={logout}
          className="absolute bottom-12"
        >
          <Text className="text-gray-600 font-bold text-xs underline uppercase tracking-widest">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StatusGate = ({ label, completed, last }: { label: string; completed: boolean; last?: boolean }) => (
  <View className={`flex-row items-center ${!last ? 'pb-3' : ''}`}>
    <View className={`w-4 h-4 rounded-full items-center justify-center ${completed ? 'bg-emerald-500' : 'bg-white/10'}`}>
      {completed && <Ionicons name="checkmark" size={10} color="white" />}
    </View>
    <Text className={`ml-3 text-[11px] font-bold ${completed ? 'text-gray-300' : 'text-gray-500 italic'}`}>
      {label}
    </Text>
  </View>
);
