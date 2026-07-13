import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useData } from '../../lib/store';
import { colors, fonts } from '../../lib/theme';

const icon = (name, nameActive) => ({ color, focused }) => (
  <Ionicons name={focused ? nameActive : name} size={22} color={color} />
);

export default function StudentTabs() {
  const data = useData();
  if (data.isStaff) return <Redirect href="/" />;
  return (
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
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('sunny-outline', 'sunny') }} />
      <Tabs.Screen name="plan" options={{ title: 'My plan', tabBarIcon: icon('map-outline', 'map') }} />
      <Tabs.Screen name="docs" options={{ title: 'Documents', tabBarIcon: icon('library-outline', 'library') }} />
    </Tabs>
  );
}
