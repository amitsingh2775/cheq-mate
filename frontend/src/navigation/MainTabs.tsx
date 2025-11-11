import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Mic, User } from 'lucide-react-native';
import FeedScreen from '../screens/Main/FeedScreen';
import MyRecordsScreen  from '../screens/Main/MyRecordsScreen';
import RecordScreen from '@/screens/Main/RecordScreen';
import CreatePostScreen from '../screens/Main/CreatePostScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import PendingBoxScreen from '../screens/Main/PendingBoxScreen';
import { View, StyleSheet } from 'react-native';

export type MainTabParamList = {
  Feed: undefined;
  Record: undefined;
  Profile: undefined;
};

export type RecordStackParamList = {
  RecordMain: undefined;
  CreatePost: { audioUri: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PendingBox: undefined;
   MyRecords: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const RecordStack = createStackNavigator<RecordStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function RecordStackScreen() {
  return (
    <RecordStack.Navigator screenOptions={{ headerShown: false }}>
      <RecordStack.Screen name="RecordMain" component={RecordScreen} />
      <RecordStack.Screen name="CreatePost" component={CreatePostScreen} />
    </RecordStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="PendingBox" component={PendingBoxScreen} />
      <ProfileStack.Screen name="MyRecords" component={MyRecordsScreen}/>
    </ProfileStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordStackScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.centerTab, focused && styles.centerTabActive]}>
              <Mic color="#000" size={28} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: 60,
    paddingBottom: 8,
  },
  centerTab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  centerTabActive: {
    backgroundColor: '#FFC700',
  },
});
