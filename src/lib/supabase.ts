import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read credentials from environment variables — never hardcode secrets in source.
// Values are defined in .env.local (gitignored) using the EXPO_PUBLIC_ prefix.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kfydsuuelaxaffntdjxh.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWRzdXVlbGF4YWZmbnRkanhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDM1NDQsImV4cCI6MjA4ODExOTU0NH0._hb_RTEmoUevs3fjlv3IaZksZo7Ho3AdIdprYA1OaGQ';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Ensure EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env.local.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
