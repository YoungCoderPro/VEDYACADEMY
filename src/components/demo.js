// Floating "Demo mode" pill shown while exploring the app without an account.
// Lets you flip between the teacher view and the student view, or exit.

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useData } from '../lib/store';
import { colors, fonts, shadow } from '../lib/theme';

export function DemoBar() {
  const data = useData();
  const router = useRouter();
  if (!data?.demoRole) return null;

  const isTeacher = data.demoRole === 'teacher';

  const switchRole = () => {
    data.switchDemoRole();
    router.replace(isTeacher ? '/home' : '/today');
  };

  const exit = () => {
    data.exitDemo();
    router.replace('/');
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        <View style={styles.dot} />
        <Text style={styles.label}>
          Demo · viewing as {isTeacher ? 'Teacher' : 'Student'}
        </Text>
        <Pressable onPress={switchRole} style={styles.btn}>
          <Ionicons name="swap-horizontal" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.btnText}>View as {isTeacher ? 'Student' : 'Teacher'}</Text>
        </Pressable>
        <Pressable onPress={exit} hitSlop={8} style={{ marginLeft: 6, padding: 4 }}>
          <Ionicons name="close" size={16} color="#C9D6E8" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 74 : 92,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.pineDark,
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14,
    ...shadow.card,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.marigold, marginRight: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#F4F7FB', marginRight: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF22', borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#fff' },
});
