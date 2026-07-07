// Client-side Supabase configuration
// Note: To prevent exposing keys, all database writes flow through our backend API (/api/*)
// This client is a placeholder for direct client-side reads if configured, but defaults to backend routing.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
