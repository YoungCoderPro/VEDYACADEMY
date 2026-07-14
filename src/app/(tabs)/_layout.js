import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useData } from '../../lib/store';
import { View } from 'react-native';
import { DemoBar } from '../../components/demo';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors, fonts } from '../../lib/theme';

const icon = (name, nameActive) => ({ color, focused }) => (
  <Ionicons name={focused ? nameActive : name} size={22} color={color} />
);

export default function TabsLayout() {
  const data = useData();
  if (data) {
    if (data.status === 'signedOut' && !data.demoRole) return <Redirect href="/signin" />;
    if (data.status === 'pending') return <Redirect href="/waiting" />;
    if (!data.isStaff) return <Redirect href="/home" />;
  }
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pine,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: Platform.OS === 'web' ? 62 : undefined,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: icon('sunny-outline', 'sunny') }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: icon('library-outline', 'library') }} />
    </Tabs>
    <DemoBar />
    </View>
  );
}
