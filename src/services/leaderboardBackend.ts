// ============================================================
// UTM Gesture Quest — Leaderboard Backend Architecture
// Abstract interface supporting current IndexedDB offline storage
// and prepared for future optional Supabase Cloud synchronization
// ============================================================

import type { LeaderboardEntry, DifficultyLevel, ControlMode } from '../types';
import {
  addLeaderboardEntry as addIdbEntry,
  getLeaderboard as getIdbLeaderboard,
  deleteLeaderboardEntry as deleteIdbEntry,
  deleteEntryPhoto as deleteIdbPhoto,
  clearAllLeaderboard as clearIdbAll,
  getTotalEntriesCount as getIdbTotalCount,
} from './leaderboardDb';

export interface LeaderboardService {
  name: 'indexeddb' | 'supabase';
  addEntry(entry: {
    nickname: string;
    photo?: string;
    avatarId?: number;
    difficulty: DifficultyLevel;
    timeSeconds: number;
    controlMode: ControlMode;
  }): Promise<LeaderboardEntry>;
  getLeaderboard(difficulty?: DifficultyLevel, limit?: number): Promise<LeaderboardEntry[]>;
  deleteEntry(id: string): Promise<boolean>;
  deletePhoto(id: string): Promise<boolean>;
  clearAll(): Promise<boolean>;
  getTotalCount(): Promise<number>;
}

/**
 * Default Implementation: Offline IndexedDB Service
 * Zero cloud dependency, origin-isolated, 100% reliable for on-prem exhibition booths
 */
export const indexedDbBackend: LeaderboardService = {
  name: 'indexeddb',
  addEntry: addIdbEntry,
  getLeaderboard: getIdbLeaderboard,
  deleteEntry: deleteIdbEntry,
  deletePhoto: deleteIdbPhoto,
  clearAll: clearIdbAll,
  getTotalCount: getIdbTotalCount,
};

/**
 * Future Supabase Adapter Architecture Blueprint
 *
 * To enable Supabase Cloud Synchronization in the future:
 * 1. Install @supabase/supabase-js:
 *    npm install @supabase/supabase-js
 *
 * 2. Create the table in Supabase SQL Editor:
 *    CREATE TABLE leaderboard (
 *      id TEXT PRIMARY KEY,
 *      nickname TEXT NOT NULL,
 *      photo TEXT,
 *      avatar_id INT DEFAULT 1,
 *      difficulty TEXT NOT NULL,
 *      time_seconds NUMERIC(5,2) NOT NULL,
 *      control_mode TEXT NOT NULL,
 *      created_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 *
 * 3. Add environment variables in .env:
 *    VITE_SUPABASE_URL=https://your-project.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * 4. Instantiate and export supabaseBackend below when ready.
 */

// Active Leaderboard Backend (Defaults to IndexedDB)
export const currentLeaderboardBackend: LeaderboardService = indexedDbBackend;
