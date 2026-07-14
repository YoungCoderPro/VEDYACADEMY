// Sign-in page: real login (email/password + Google) plus Demo mode, which
// explores the whole app with sample data and no account.

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from '../components/auth';
import { useData } from '../lib/store';
import { colors, fonts, radius, shadow } from '../lib/theme';

export default function SignIn() {
  const data = useData();
  const router = useRouter();

  // Once a session lands (including returning from Google with tokens in the
  // URL), route to the right place automatically.
  useEffect(() => {
    if (!data) return;
    if (data.demoRole) {
      router.replace(data.demoRole === 'teacher' ? '/today' : '/home');
    } else if (data.status === 'ready') {
      router.replace(data.isStaff ? '/today' : '/home');
    } else if (data.status === 'pending') {
      router.replace('/waiting');
    }
  }, [data?.status, data?.demoRole, data?.isStaff]);

  const enter = (role) => {
    data.enterDemo(role);
    router.replace(role === 'teacher' ? '/today' : '/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* back to landing */}
      <Pressable onPress={() => router.replace('/')} style={styles.back} hitSlop={8}>
        <Ionicons name="arrow-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Back to vedyacademy.org</Text>
      </Pressable>

      <LoginScreen
        footer={
          <View style={styles.demoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="flask-outline" size={16} color={colors.marigold} style={{ marginRight: 6 }} />
              <Text style={styles.demoTitle}>Just looking? Try the demo</Text>
            </View>
            <Text style={styles.demoBody}>
              Explore the whole platform with sample data — no account needed, nothing is saved.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => enter('teacher')} style={({ hovered }) => [styles.demoBtn, hovered && { opacity: 0.9 }]}>
                <Ionicons name="easel-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.demoBtnText}>Teacher view</Text>
              </Pressable>
              <Pressable onPress={() => enter('student')} style={({ hovered }) => [styles.demoBtn, { backgroundColor: colors.marigold }, hovered && { opacity: 0.9 }]}>
                <Ionicons name="school-outline" size={15} color="#2E230C" style={{ marginRight: 6 }} />
                <Text style={[styles.demoBtnText, { color: '#2E230C' }]}>Student view</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute', top: 18, left: 18, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.muted, marginLeft: 6 },
  demoCard: {
    marginTop: 18, backgroundColor: colors.pineSoft, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: 14,
  },
  demoTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  demoBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted },
  demoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.pine, borderRadius: radius.md, paddingVertical: 10, ...shadow.card,
  },
  demoBtnText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: '#fff' },
});
