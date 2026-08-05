import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey || anonKey.startsWith('KLISTRA_IN')) {
  throw new Error(
    'Supabase-konfiguration saknas. Fyll i VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY i frontend/.env.local och starta om dev-servern.',
  );
}

export const supabase = createClient(url, anonKey);
