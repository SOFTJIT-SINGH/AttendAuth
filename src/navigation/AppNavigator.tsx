import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/Login';
import { RegisterScreen } from '../screens/auth/Register';
import { StudentDashboard } from '../screens/student/Dashboard';
import { MarkAttendance } from '../screens/student/MarkAttendance';
import { AttendanceHistory } from '../screens/student/History';
import { TeacherDashboard } from '../screens/teacher/Dashboard';
import { TeacherReports } from '../screens/teacher/Reports';
import { HoDDashboard } from '../screens/hod/Dashboard';
import { ManageClasses } from '../screens/hod/ManageClasses';

const Root = createStackNavigator();
const Tab = createBottomTabNavigator();

const StudentTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={StudentDashboard} />
    <Tab.Screen name="Mark" component={MarkAttendance} />
    <Tab.Screen name="History" component={AttendanceHistory} />
  </Tab.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Dashboard" component={TeacherDashboard} />
    <Tab.Screen name="Reports" component={TeacherReports} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, loading } = useAuthStore();

  if (loading) return null; // Add Splash/Skeleton if needed

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Root.Screen name="Login" component={LoginScreen} />
            <Root.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'STUDENT' ? (
          <Root.Screen name="Student" component={StudentTabs} />
        ) : user.role === 'TEACHER' ? (
          <Root.Screen name="Teacher" component={TeacherTabs} />
        ) : (
          <Root.Screen name="HoD" component={HoDDashboard} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};