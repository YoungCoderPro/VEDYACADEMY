import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { DataProvider, useData } from '../lib/store';
import { LoginScreen, WaitingScreen, LoadingScreen } from '../components/auth';
import { colors } from '../lib/theme';

function Gate() {
  const data = useData();
  if (!data || data.status === 'loading') return <LoadingScreen />;
  // status can hang on 'loading' only briefly; unconfigured shows inside LoginScreen
  if (data.status === 'signedOut') return <LoginScreen />;
  if (data.status === 'pending') return <WaitingScreen />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="student/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.pine} />
      </View>
    );
  }

  return (
    <DataProvider>
      <StatusBar style="dark" />
      <Gate />
    </DataProvider>
  );
}
