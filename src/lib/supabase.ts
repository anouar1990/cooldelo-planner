import { Platform } from 'react-native';

// Supabase is not yet configured — placeholder to avoid import.meta errors on web.
// Replace these with real values from your Supabase project dashboard,
// then wire up auth in the screens.
let supabase: any = null;

if (Platform.OS !== 'web') {
  try {
    // Only initialise Supabase on native where import.meta is not an issue
    // TODO: uncomment once real keys are set
    // require('react-native-url-polyfill/auto');
    // const { createClient } = require('@supabase/supabase-js');
    // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // supabase = createClient('https://your-project.supabase.co', 'your-anon-key', {
    //   auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true },
    // });
  } catch (e) {
    // Supabase not yet configured
  }
}

export { supabase };
