import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/Login';
import { RegisterScreen } from '../screens/auth/Register';
import { OtpScreen } from '../screens/auth/Otp';
import { StudentDashboard } from '../screens/student/Dashboard';
import { MarkAttendance } from '../screens/student/MarkAttendance';
import { AttendanceHistory } from '../screens/student/History';
import { TeacherDashboard } from '../screens/teacher/Dashboard';
import { TeacherReports } from '../screens/teacher/Reports';
import { HoDDashboard } from '../screens/hod/Dashboard';
import { ManageClasses } from '../screens/hod/ManageClasses';
import { ManageStaff } from '../screens/hod/ManageStaff';
import { ManageStudents } from '../screens/teacher/ManageStudents';
import { PendingVerificationScreen } from '../screens/auth/PendingVerification';
import { ProfileScreen } from '../screens/common/Profile';
import { ClassListScreen } from '../screens/common/ClassList';
import { SupportScreen } from '../screens/common/Support';

const Root = createStackNavigator();
const Tab = createBottomTabNavigator();
const TeacherStack = createStackNavigator();
const HoDStack = createStackNavigator();

const TAB_BAR_STYLE = {
  backgroundColor: '#0F172A',
  borderTopColor: 'rgba(255,255,255,0.05)',
  borderTopWidth: 1,
  height: Platform.OS === 'ios' ? 88 : 70,
  paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  paddingTop: 10,
  elevation: 0,
};

type TabIconProps = {
  name: string;
  focused: boolean;
  color: string;
  activeBg?: string;
};

const TabIcon = ({ name, focused, color, activeBg = 'bg-indigo-500/10' }: TabIconProps) => (
  <View className={`w-11 h-8 rounded-xl justify-center items-center ${focused ? activeBg : ''}`}>
    <Ionicons name={name as any} size={22} color={color} />
  </View>
);

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: TAB_BAR_STYLE,
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
    }}
  >
    <Tab.Screen name="Home" component={StudentDashboard} options={{ 
      tabBarLabel: 'Home',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
    }} />
    <Tab.Screen name="Mark" component={MarkAttendance} options={{ 
      tabBarLabel: 'Check-In',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'camera' : 'camera-outline'} focused={focused} color={color} />
    }} />
    <Tab.Screen name="History" component={AttendanceHistory} options={{ 
      tabBarLabel: 'History',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'list' : 'list-outline'} focused={focused} color={color} />
    }} />
    <Tab.Screen name="Schedule" component={ClassListScreen} options={{ 
      tabBarLabel: 'Schedule',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />
    }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ 
      tabBarLabel: 'My Profile',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
    }} />
  </Tab.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: TAB_BAR_STYLE,
      tabBarActiveTintColor: '#f59e0b',
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
    }}
  >
    <Tab.Screen name="Dashboard" component={TeacherDashboard} options={{ 
      tabBarLabel: 'Home',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} color={color} activeBg="bg-orange-500/10" />
    }} />
    <Tab.Screen name="Reports" component={TeacherReports} options={{ 
      tabBarLabel: 'Reports',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} color={color} activeBg="bg-orange-500/10" />
    }} />
    <Tab.Screen name="Schedule" component={ClassListScreen} options={{ 
      tabBarLabel: 'Schedule',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} activeBg="bg-orange-500/10" />
    }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ 
      tabBarLabel: 'My Profile',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} activeBg="bg-orange-500/10" />
    }} />
  </Tab.Navigator>
);

const TeacherNavigator = () => (
  <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
    <TeacherStack.Screen name="TeacherTabs" component={TeacherTabs} />
    <TeacherStack.Screen name="ManageStudents" component={ManageStudents} />
    <TeacherStack.Screen name="ManageClasses" component={ManageClasses} />
  </TeacherStack.Navigator>
);

const HoDTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: TAB_BAR_STYLE,
      tabBarActiveTintColor: '#0ea5e9',
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
    }}
  >
    <Tab.Screen name="HHome" component={HoDDashboard} options={{ 
      tabBarLabel: 'Home',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'rocket' : 'rocket-outline'} focused={focused} color={color} activeBg="bg-sky-500/10" />
    }} />
    <Tab.Screen name="Schedule" component={ClassListScreen} options={{ 
      tabBarLabel: 'Schedule',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} activeBg="bg-sky-500/10" />
    }} />
    <Tab.Screen name="HProfile" component={ProfileScreen} options={{ 
      tabBarLabel: 'My Profile',
      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} activeBg="bg-sky-500/10" />
    }} />
  </Tab.Navigator>
);

const HoDNavigator = () => (
  <HoDStack.Navigator screenOptions={{ headerShown: false }}>
    <HoDStack.Screen name="HoDTabs" component={HoDTabs} />
    <HoDStack.Screen name="ManageClasses" component={ManageClasses} />
    <HoDStack.Screen name="ManageStaff" component={ManageStaff} />
    <HoDStack.Screen name="ManageStudents" component={ManageStudents} />
    <HoDStack.Screen name="Reports" component={TeacherReports} />
  </HoDStack.Navigator>
);

export const AppNavigator = () => {
  const { user, loading } = useAuthStore();
  if (loading) return null;

  return (
    <Root.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {!user ? (
        <>
          <Root.Screen name="Login" component={LoginScreen} />
          <Root.Screen name="Register" component={RegisterScreen} />
          <Root.Screen name="Otp" component={OtpScreen} />
        </>
      ) : !user.is_verified ? (
        <Root.Screen name="Pending" component={PendingVerificationScreen} />
      ) : user.role === 'STUDENT' ? (
        <>
          <Root.Screen name="Student" component={StudentTabs} />
          <Root.Screen name="Support" component={SupportScreen} />
        </>
      ) : user.role === 'TEACHER' ? (
        <>
          <Root.Screen name="Teacher" component={TeacherNavigator} />
          <Root.Screen name="Support" component={SupportScreen} />
        </>
      ) : (
        <>
          <Root.Screen name="HoD" component={HoDNavigator} />
          <Root.Screen name="Support" component={SupportScreen} />
        </>
      )}
    </Root.Navigator>
  );
};