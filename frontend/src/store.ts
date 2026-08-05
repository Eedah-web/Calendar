import { supabase } from './supabaseClient';

export interface Note {
  id: string;
  text: string;
  createdAt: string; // ISO
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  person?: string;
  timeFrom?: string; // HH:mm
  timeTo?: string;   // HH:mm
  notes?: Note[];
  status?: 'active' | 'onhold' | 'complete';
}

export type TaskMap = Record<string, Task[]>;

export const TASKS_KEY   = 'sv-kal-tasks';
export const PERSONS_KEY = 'sv-kal-persons';
export const PRESETS_KEY = 'sv-kal-presets';
export const ARCHIVE_KEY = 'sv-kal-archive';

export const TAG_COLORS = ['blue', 'green', 'volcano', 'orange', 'purple', 'cyan', 'magenta', 'gold'];

export const tagColor = (name: string, list?: string[]) => {
  // Color by the person's position in the list so adjacent names get different colors.
  // Falls back to a name hash if the person is not in the list.
  const pos = list?.indexOf(name) ?? -1;
  const idx = pos >= 0
    ? pos
    : name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TAG_COLORS[idx % TAG_COLORS.length];
};

let _n = 0;
export const uid = () => `${Date.now()}-${++_n}`;

export interface ArchivedNote {
  id: string;
  taskText: string;
  taskPerson?: string;
  date: string;       // YYYY-MM-DD
  note: Note;
  archivedAt: string; // ISO
}

/* ──────────────────────────────────────────────────────────────
   Supabase sync

   Local storage acts as a synchronous cache so every page can read
   the data directly (loadTasks() etc.). On login the user's data is
   fetched from Supabase into the cache (hydrate). Every time the app
   saves, the data is written both to the cache and up to Supabase
   (per user).
   ────────────────────────────────────────────────────────────── */

// server key -> localStorage key
const KEY_MAP: Record<'tasks' | 'persons' | 'presets' | 'archive', string> = {
  tasks: TASKS_KEY,
  persons: PERSONS_KEY,
  presets: PRESETS_KEY,
  archive: ARCHIVE_KEY,
};

let currentUserId: string | null = null;

// Fetches the signed-in user's data from Supabase and fills the localStorage cache.
// Run by AuthGate before the app renders.
export async function hydrate(userId: string): Promise<void> {
  currentUserId = userId;

  const { data, error } = await supabase
    .from('app_state')
    .select('key, value')
    .eq('user_id', userId);

  if (error) {
    console.error('Could not fetch data from Supabase:', error.message);
    return;
  }

  const byKey = new Map((data ?? []).map((row) => [row.key as string, row.value]));

  for (const [serverKey, localKey] of Object.entries(KEY_MAP)) {
    const value = byKey.get(serverKey);
    if (value != null) {
      localStorage.setItem(localKey, JSON.stringify(value));
    } else {
      localStorage.removeItem(localKey); // no data on the server -> start empty
    }
  }
}

// Clears the cache (on logout) so the next user does not see the previous user's data.
export function clearLocal(): void {
  currentUserId = null;
  Object.values(KEY_MAP).forEach((k) => localStorage.removeItem(k));
}

// Debounced upload to Supabase (last-write-wins per key).
const timers: Record<string, ReturnType<typeof setTimeout>> = {};

function push(serverKey: keyof typeof KEY_MAP, value: unknown): void {
  if (!currentUserId) return;
  const userId = currentUserId;

  if (timers[serverKey]) clearTimeout(timers[serverKey]);
  timers[serverKey] = setTimeout(async () => {
    const { error } = await supabase.from('app_state').upsert(
      {
        user_id: userId,
        key: serverKey,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' },
    );
    if (error) console.error(`Could not save "${serverKey}" to Supabase:`, error.message);
  }, 400);
}

/* ── synchronous cache reads (unchanged API for the pages) ── */

export function loadTasks(): TaskMap {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? '{}'); } catch { return {}; }
}

export function saveTasks(m: TaskMap) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(m));
  push('tasks', m);
}

export function loadPersons(): string[] {
  try { return JSON.parse(localStorage.getItem(PERSONS_KEY) ?? '[]'); } catch { return []; }
}

export function savePersons(p: string[]) {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(p));
  push('persons', p);
}

export function loadPresets(): string[] {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]'); } catch { return []; }
}

export function savePresets(p: string[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(p));
  push('presets', p);
}

export function loadArchive(): ArchivedNote[] {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? '[]'); } catch { return []; }
}

export function saveArchive(a: ArchivedNote[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a));
  push('archive', a);
}
