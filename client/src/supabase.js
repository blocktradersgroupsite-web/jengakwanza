import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client & Authentication Layer for Jenga Kwanza POS ERP
 * Supports configuration via:
 * 1. Vite Environment Variables (.env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. In-App Setup (localStorage: jk_supabase_url, jk_supabase_anon_key)
 */

export const getSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = (localStorage.getItem('jk_supabase_url') || '').trim();
    localKey = (localStorage.getItem('jk_supabase_anon_key') || '').trim();
  } catch (err) {
    console.warn('Cannot read localStorage for Supabase keys:', err);
  }

  const url = envUrl || localUrl;
  const anonKey = envKey || localKey;

  return {
    url,
    anonKey,
    hasEnv: Boolean(envUrl && envKey),
    isConfigured: Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20)
  };
};

export const saveSupabaseConfig = (url, anonKey) => {
  try {
    if (url) localStorage.setItem('jk_supabase_url', url.trim());
    else localStorage.removeItem('jk_supabase_url');

    if (anonKey) localStorage.setItem('jk_supabase_anon_key', anonKey.trim());
    else localStorage.removeItem('jk_supabase_anon_key');

    // Reset singleton client
    supabaseInstance = null;
  } catch (err) {
    console.warn('Failed to save Supabase config:', err);
  }
};

let supabaseInstance = null;

export const getSupabase = () => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (
    !supabaseInstance ||
    supabaseInstance.__url !== config.url ||
    supabaseInstance.__key !== config.anonKey
  ) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      supabaseInstance.__url = config.url;
      supabaseInstance.__key = config.anonKey;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const isSupabaseConfigured = () => {
  return getSupabaseConfig().isConfigured;
};

/**
 * Test if the Supabase URL and Key are reachable
 */
export const testSupabaseConnection = async () => {
  const client = getSupabase();
  if (!client) {
    return { ok: false, error: 'Supabase URL or Anon Public Key is missing.' };
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error && error.message?.includes('Invalid API key')) {
      return { ok: false, error: 'Invalid cloud access key. Please check your credentials.' };
    }
    return { ok: true, session: data?.session };
  } catch (err) {
    return { ok: false, error: err.message || 'Connection failed to reach cloud services.' };
  }
};

/**
 * Sign In with Email & Password
 */
export const supabaseSignIn = async (email, password) => {
  const client = getSupabase();
  if (!client) {
    throw new Error('Cloud authentication service is not connected.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    throw error;
  }

  return formatSupabaseUser(data.user, data.session);
};

/**
 * Sign Up new User (Owner or Staff)
 */
export const supabaseSignUp = async (email, password, { name, role = 'admin', shopId = 'shop-main' } = {}) => {
  const client = getSupabase();
  if (!client) {
    throw new Error('Cloud authentication service is not connected.');
  }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name || (role === 'admin' ? 'Store Owner' : 'Staff Member'),
        role: role || 'admin',
        assignedShopId: shopId || 'shop-main'
      }
    }
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user ? formatSupabaseUser(data.user, data.session) : null,
    session: data.session
  };
};

/**
 * Sign Out
 */
export const supabaseSignOut = async () => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (err) {
    console.warn('Error during Supabase signout:', err);
  }
};

/**
 * Format a Supabase Auth User into standard Jenga Kwanza user object
 */
export const formatSupabaseUser = (sbUser, session = null) => {
  if (!sbUser) return null;

  const metadata = sbUser.user_metadata || {};
  const appMetadata = sbUser.app_metadata || {};
  
  // Determine role: default to admin if email contains admin or owner, or from metadata
  let role = metadata.role || appMetadata.role;
  if (!role) {
    const emailLower = (sbUser.email || '').toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('owner') || emailLower.includes('director')) {
      role = 'admin';
    } else {
      role = 'cashier';
    }
  }

  return {
    id: sbUser.id,
    name: metadata.name || sbUser.email?.split('@')[0] || (role === 'admin' ? 'Store Owner' : 'Staff Member'),
    email: sbUser.email,
    role: role, // 'admin' | 'cashier' | 'manager'
    assignedShopId: metadata.assignedShopId || 'shop-main',
    isSupabase: true,
    supabaseSession: session
  };
};

/**
 * Check and restore active Supabase session
 */
export const getActiveSupabaseUser = async () => {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.user) return null;
    return formatSupabaseUser(data.session.user, data.session);
  } catch (err) {
    console.warn('Could not restore Supabase session:', err);
    return null;
  }
};

/**
 * Listen for auth state changes
 */
export const onSupabaseAuthStateChange = (callback) => {
  const client = getSupabase();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    const formatted = session?.user ? formatSupabaseUser(session.user, session) : null;
    callback(event, formatted);
  });

  return () => {
    subscription.unsubscribe();
  };
};
