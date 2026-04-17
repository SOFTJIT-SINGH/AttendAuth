import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout, setSession } = useAuthStore();
  
  // Edit Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);

  // Face Capture State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' }
    ]);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editName.trim(),
          phone: editPhone.trim()
        })
        .eq('id', user!.id);

      if (error) throw error;

      setSession({
        ...user!,
        full_name: editName.trim(),
        phone: editPhone.trim()
      });

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCaptureFace = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      if (photo?.base64) {
        const { error } = await supabase
          .from('profiles')
          .update({ face_ref_blob: photo.base64 })
          .eq('id', user!.id);

        if (error) throw error;

        // Save locally for speed
        if (user?.email) {
          const safeKey = `face_ref_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          await AsyncStorage.setItem(safeKey, photo.base64);
        }
        
        setSession({ ...user!, face_ref_blob: photo.base64 });
        Alert.alert('Identity Secured', 'Your face biometric has been saved successfully.');
        setShowCamera(false);
      }
    } catch (e: any) {
      Alert.alert('Capture Failed', e.message);
    } finally {
      setCapturing(false);
    }
  };

  const INFO_ITEMS = [
    { label: 'Email Address', value: user?.email, icon: 'mail-outline' },
    { label: 'Phone Number', value: user?.phone || 'Not linked', icon: 'call-outline' },
    { label: 'Verified Status', value: user?.is_verified ? 'Verified Account' : 'Pending Verification', icon: 'shield-checkmark-outline', color: user?.is_verified ? '#10b981' : '#f59e0b' },
  ];

  if (showCamera) {
    return (
      <View className="flex-1 bg-black">
        <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef} />
        <View className="absolute top-16 left-6 right-6 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setShowCamera(false)} className="w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/20">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <View className="bg-indigo-500 px-4 py-2 rounded-full">
            <Text className="text-white text-[10px] font-black uppercase">Identity Enrollment</Text>
          </View>
          <View className="w-10" />
        </View>
        <View className="absolute bottom-16 left-0 right-0 items-center">
          <TouchableOpacity onPress={handleCaptureFace} disabled={capturing} className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
             {capturing ? <ActivityIndicator color="#fff" /> : <View className="w-16 h-16 bg-white rounded-full" />}
          </TouchableOpacity>
          <Text className="text-white text-[10px] font-bold uppercase mt-4">Capture Face Reference</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f115', 'transparent']} className="absolute inset-0 h-[400px]" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="px-6 pt-16" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="items-center mb-10">
          <View className="w-28 h-28 items-center justify-center">
            <View className="absolute inset-0 bg-indigo-500 rounded-[40px] opacity-20 rotate-12" />
            <View className={`w-24 h-24 bg-white/10 rounded-[35px] border ${user?.face_ref_blob ? 'border-indigo-500/40' : 'border-red-500/40'} items-center justify-center shadow-2xl backdrop-blur-3xl overflow-hidden`}>
              {user?.face_ref_blob ? (
                <Image source={{ uri: `data:image/jpeg;base64,${user.face_ref_blob}` }} className="w-full h-full" />
              ) : (
                <Text className="text-white text-3xl font-black">
                  {(user?.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
          
          <Text className="text-white text-2xl font-black mt-6 tracking-tight">
            {user?.full_name || 'Anonymous User'}
          </Text>
          <Text className="text-gray-500 text-[10px] font-black tracking-[4px] uppercase mt-1">
            {user?.role} ACCESS
          </Text>
        </View>

        {/* Identity Alert */}
        {!user?.face_ref_blob && user?.role === 'STUDENT' && (
           <View className="bg-red-500/10 border border-red-500/20 p-6 rounded-[35px] mb-8">
              <View className="flex-row items-center mb-3">
                 <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                 <Text className="text-red-500 font-black text-[10px] uppercase">Identity Missing</Text>
              </View>
              <Text className="text-gray-400 text-xs font-medium leading-5 mb-4">
                 You haven't registered your biometric face reference. Secure attendance requires a face match.
              </Text>
              <TouchableOpacity 
                onPress={async () => {
                  const { granted } = await requestCamera();
                  if (granted) setShowCamera(true);
                  else Alert.alert('Error', 'Camera permission required.');
                }}
                className="bg-red-500 py-4 rounded-2xl items-center"
              >
                 <Text className="text-white font-black text-[10px] uppercase">Register Face ID Now</Text>
              </TouchableOpacity>
           </View>
        )}

        {/* Credentials Section */}
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mb-4 px-2">Account Registry</Text>
        <View className="bg-white/5 rounded-[40px] border border-white/10 p-6 gap-4">
          <TouchableOpacity onPress={() => setIsEditing(true)} className="flex-row items-center p-4 bg-white/5 rounded-3xl border border-white/5">
             <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-4">
                <Ionicons name="person-outline" size={18} color="#6366f1" />
             </View>
             <View className="flex-1">
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Full Name</Text>
                <Text className="text-white text-sm font-bold mt-0.5">{user?.full_name}</Text>
             </View>
             <Ionicons name="create-outline" size={16} color="#475569" />
          </TouchableOpacity>

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
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-10 mb-4 px-2">System Actions</Text>
        <View className="gap-3">
          <TouchableOpacity onPress={() => navigation.navigate('Support')} className="flex-row items-center p-5 bg-white/5 rounded-[30px] border border-white/10">
            <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-4">
              <Ionicons name="help-buoy-outline" size={18} color="#6366f1" />
            </View>
            <Text className="text-white font-bold flex-1">Support Center</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-5 bg-red-500/5 rounded-[30px] border border-red-500/10">
            <View className="w-10 h-10 rounded-2xl bg-red-500/10 items-center justify-center mr-4">
              <Ionicons name="power" size={18} color="#ef4444" />
            </View>
            <Text className="text-red-500 font-bold flex-1">Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Modal */}
        <Modal visible={isEditing} animationType="fade" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#0f172a] rounded-t-[50px] p-10 border-t border-white/10">
              <View className="items-center mb-8">
                 <Text className="text-white text-2xl font-black italic">Edit Profile</Text>
              </View>
              <View className="gap-4">
                <View className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                  <TextInput value={editName} onChangeText={setEditName} placeholder="Full Name" placeholderTextColor="#475569" className="text-white font-bold" />
                </View>
                <View className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                  <TextInput value={editPhone} onChangeText={setEditPhone} placeholder="Phone Number" placeholderTextColor="#475569" className="text-white font-bold" />
                </View>
                <TouchableOpacity onPress={handleUpdate} disabled={updating} className="bg-indigo-500 py-5 rounded-[30px] items-center">
                  {updating ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase tracking-widest">Update Profile</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)} className="py-4 items-center">
                  <Text className="text-gray-500 font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};
