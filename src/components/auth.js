// Auth screens: Login (email/password + Google) and the Waiting room shown to
// signed-up accounts that the teacher hasn't linked/approved yet.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, T } from './ui';
import { useData } from '../lib/store';
import { colors, fonts, radius, shadow } from '../lib/theme';
import { configured } from '../lib/supabase';

export function LoginScreen({ footer }) {
  const data = useData();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: e } = await data.signInEmail(email.trim(), password);
        if (e) setError(e.message);
      } else {
        const { data: res, error: e } = await data.signUpEmail(email.trim(), password, name.trim());
        if (e) setError(e.message);
        else if (!res.session) setInfo('Account created. Check your email to confirm your address, then sign in.');
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    const { error: e } = await data.signInGoogle();
    if (e) setError(e.message);
  };

  if (!configured) {
    return (
      <Shell>
        <T.semi style={{ fontSize: 16, textAlign: 'center' }}>Supabase isn’t configured yet</T.semi>
        <T.muted style={{ textAlign: 'center', marginTop: 8 }}>
          Open src/lib/supabase.js and paste your project URL and anon key, then reload.
        </T.muted>
      </Shell>
    );
  }

  return (
    <Shell>
      <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
      <T.muted style={{ textAlign: 'center', marginBottom: 20 }}>
        {mode === 'signin'
          ? 'Sign in to your VedyAcademy account.'
          : 'Sign up, then Vedya will link your account to your student profile.'}
      </T.muted>

      {mode === 'signup' && (
        <Input icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
      )}
      <Input icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" />
      <Input icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword}
        secureTextEntry autoCapitalize="none" />

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!info && <Text style={styles.info}>{info}</Text>}

      <Button
        title={busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        onPress={submit}
        disabled={busy || !email.trim() || password.length < 6 || (mode === 'signup' && !name.trim())}
        style={{ marginTop: 6 }}
      />
      {password.length > 0 && password.length < 6 && (
        <T.small style={{ marginTop: 6, textAlign: 'center' }}>Password needs at least 6 characters.</T.small>
      )}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <T.small style={{ marginHorizontal: 10 }}>or</T.small>
        <View style={styles.dividerLine} />
      </View>

      <Button title="Continue with Google" icon="logo-google" kind="ghost" onPress={google} />

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Button
          title={mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          kind="quiet" small
          onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
        />
      </View>
      {footer}
    </Shell>
  );
}

export function WaitingScreen() {
  const data = useData();
  return (
    <Shell>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.waitBadge}>
          <Ionicons name="hourglass-outline" size={28} color={colors.pine} />
        </View>
        <Text style={[styles.title, { marginTop: 14 }]}>Almost there</Text>
        <T.muted style={{ textAlign: 'center', marginTop: 6, maxWidth: 320 }}>
          Your account is created{data.profile?.email ? ` (${data.profile.email})` : ''}. Vedya just needs to
          link it to your student profile — let her know you’ve signed up, then check back.
        </T.muted>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Button title="Check again" icon="refresh" kind="quiet" small onPress={() => data.refresh?.() || window.location?.reload?.()} />
          <Button title="Sign out" kind="ghost" small onPress={() => data.signOut()} />
        </View>
      </View>
    </Shell>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.pine} size="large" />
    </View>
  );
}

function Shell({ children }) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 84, height: 84, borderRadius: 20 }}
            resizeMode="contain"
          />
        </View>
        {children}
      </View>
      <T.small style={{ marginTop: 16 }}>VedyAcademy · English tutoring</T.small>
    </View>
  );
}

function Input({ icon, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={17} color={colors.faint} style={{ marginRight: 8 }} />
      <TextInput
        placeholderTextColor={colors.faint}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: 26,
    width: '100%', maxWidth: 420, borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, textAlign: 'center' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: 12, marginBottom: 10,
  },
  input: {
    flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginBottom: 8, textAlign: 'center' },
  info: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.pine, marginBottom: 8, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  waitBadge: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});
