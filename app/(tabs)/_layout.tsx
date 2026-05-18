import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Gamepad2, User, Inbox, Trophy } from 'lucide-react-native';
import { HapticTab } from '../../components/haptic-tab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00E5E5',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.3)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(13, 13, 13, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: Platform.OS === 'ios' ? 88 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : insets.bottom + 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans-Bold',
          fontSize: 10,
          fontWeight: '900',
          letterSpacing: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'GAME',
          tabBarIcon: ({ color }) => <Gamepad2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deck"
        options={{
          title: 'DECK',
          tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'LEAGUES',
          tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
