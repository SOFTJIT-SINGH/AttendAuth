import { View, Text, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SupportScreen = ({ navigation }: any) => {
  const FAQ_ITEMS = [
    {
      q: "How do I mark attendance?",
      a: "Go to the 'Check-In' tab, ensure you are within the class geofence, and complete the FaceID verification."
    },
    {
      q: "My location is not being detected.",
      a: "Ensure GPS is enabled on your device and the app has high-accuracy location permissions."
    },
    {
      q: "What if I miss my FaceID capture?",
      a: "Contact your instructor or HOD to manually verify your presence if technical issues occur."
    },
    {
      q: "How do I change my profile details?",
      a: "Basic details can be updated in the Profile tab. Role changes require HOD authorization."
    }
  ];

  const CONTACT_OPTIONS = [
    { label: 'Technical Desk', value: 'tech-support@attendauth.com', icon: 'mail-outline', type: 'email' },
    { label: 'Academic Office', value: '+1 (800) ATTEND', icon: 'call-outline', type: 'call' },
    { label: 'System Documentation', value: 'https://docs.attendauth.com', icon: 'document-text-outline', type: 'link' }
  ];

  const handleContact = (type: string, value: string) => {
    let url = '';
    if (type === 'email') url = `mailto:${value}`;
    else if (type === 'call') url = `tel:${value}`;
    else if (type === 'link') url = value;
    
    Linking.openURL(url).catch(() => {
      // Fallback if URL can't be opened
    });
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <LinearGradient colors={['#6366f110', 'transparent']} className="absolute inset-0 h-[400px]" />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-white/5">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-white text-xl font-black italic tracking-tight">Support</Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Help Center</Text>
          </View>
        </View>

        <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View className="bg-indigo-500 rounded-[40px] p-8 mb-10 overflow-hidden shadow-2xl shadow-indigo-500/20">
             <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
             <Ionicons name="help-buoy" size={48} color="#fff" />
             <Text className="text-white text-2xl font-black mt-4 leading-8">How can we assist{'\n'}you today?</Text>
          </View>

          {/* FAQ Section */}
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mb-6 px-2">Frequently Asked</Text>
          <View className="space-y-4 gap-4 mb-10">
            {FAQ_ITEMS.map((item, index) => (
              <View key={index} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <Text className="text-indigo-400 font-bold text-sm mb-3">Q: {item.q}</Text>
                <Text className="text-gray-400 text-xs leading-5 font-medium">{item.a}</Text>
              </View>
            ))}
          </View>

          {/* Contact Section */}
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mb-6 px-2">Direct Contact</Text>
          <View className="bg-white/5 border border-white/10 rounded-[40px] p-6 mb-10">
            {CONTACT_OPTIONS.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleContact(item.type, item.value)}
                className={`flex-row items-center p-4 rounded-2xl ${index !== CONTACT_OPTIONS.length - 1 ? 'border-b border-white/5 mb-2' : ''}`}
              >
                <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-4">
                  <Ionicons name={item.icon as any} size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{item.label}</Text>
                  <Text className="text-white text-sm font-bold mt-0.5">{item.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </TouchableOpacity>
            ))}
          </View>

          {/* System Info Footer */}
          <View className="mb-10 items-center opacity-30">
            <Text className="text-gray-500 text-[10px] font-black italic">Platform ID: AttendAuth_NX_2026</Text>
            <Text className="text-gray-500 text-[8px] mt-1 uppercase font-bold">End-to-End Encrypted Session</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
