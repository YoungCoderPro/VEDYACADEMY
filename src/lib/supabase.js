// Supabase client. Fill in the two values below from your Supabase project:
// Dashboard → Project Settings → API → "Project URL" and "anon public" key.
//
// The anon key is safe to ship in the app: all real security lives in the
// database's Row Level Security policies (see supabase/schema.sql).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

export const SUPABASE_URL = 'https://cxbbgmrjhpcpzslbfzjd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_QHyz66R3W_zeipx6Ya-JGg_ubI5YKpR';

export const configured =
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

// Falls back to a harmless placeholder so the app can still boot (and show a
// clear "not configured" message) before the real values are pasted in.
export const supabase = createClient(
  configured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  configured ? SUPABASE_ANON_KEY : 'placeholder-anon-key-not-configured',
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
