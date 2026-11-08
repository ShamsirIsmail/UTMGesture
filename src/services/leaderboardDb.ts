// ============================================================
// UTM Gesture Quest V3.0 — IndexedDB Leaderboard Storage Service
// Zero external dependencies, 100% offline persistence
// ============================================================

import type { LeaderboardEntry, DifficultyLevel, ControlMode } from '../types';

const DB_NAME = 'UTMGestureQuestDB';
const DB_VERSION = 1;
const STORE_NAME = 'leaderboard';

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('difficulty', 'difficulty', { unique: false });
        store.createIndex('timeSeconds', 'timeSeconds', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Add a new verified leaderboard entry
 * Note: Only CAMERA mode qualifies for official leaderboard
 */
export async function addLeaderboardEntry(entry: {
  nickname: string;
  photo?: string;
  avatarId?: number;
  difficulty: DifficultyLevel;
  timeSeconds: number;
  controlMode: ControlMode;
}): Promise<LeaderboardEntry> {
  const db = await openDb();

  const newEntry: LeaderboardEntry = {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nickname: entry.nickname.trim() || 'Peserta UTM',
    photo: entry.photo,
    avatarId: entry.avatarId || Math.floor(Math.random() * 6) + 1,
    difficulty: entry.difficulty,
    timeSeconds: parseFloat(entry.timeSeconds.toFixed(2)),
    createdAt: new Date().toISOString(),
    controlMode: entry.controlMode,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(newEntry);

    req.onsuccess = () => resolve(newEntry);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get sorted leaderboard for a difficulty (Ranked by fastest time, tie-break by earlier date)
 */
export async function getLeaderboard(
  difficulty?: DifficultyLevel,
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      let results: LeaderboardEntry[] = req.result || [];

      // Filter by difficulty if specified
      if (difficulty) {
        results = results.filter((r) => r.difficulty === difficulty);
      }

      // Filter to only include valid CAMERA completions (Mouse Preview is excluded from official ranking)
      results = results.filter((r) => r.controlMode === 'CAMERA');

      // Sort: Fastest time first. Tie breaker: earlier timestamp first
      results.sort((a, b) => {
        if (a.timeSeconds !== b.timeSeconds) {
          return a.timeSeconds - b.timeSeconds;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      resolve(results.slice(0, limit));
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a specific entry by ID (Operator action)
 */
export async function deleteLeaderboardEntry(id: string): Promise<boolean> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove participant photo while retaining score and nickname (Privacy / Parent request)
 */
export async function deleteEntryPhoto(id: string): Promise<boolean> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const entry = getReq.result as LeaderboardEntry | undefined;
      if (!entry) {
        resolve(false);
        return;
      }
      delete entry.photo;
      const updateReq = store.put(entry);
      updateReq.onsuccess = () => resolve(true);
      updateReq.onerror = () => reject(updateReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Clear all event records with confirmation
 */
export async function clearAllLeaderboard(): Promise<boolean> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count total records in database
 */
export async function getTotalEntriesCount(): Promise<number> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();

    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

export interface LeaderboardExportOptions {
  difficulty?: DifficultyLevel;
  includePhotos?: boolean;
}

/**
 * Export leaderboard data as structured JSON string
 * @param options.includePhotos If false, strips participant photos for privacy & small file size
 */
export async function exportLeaderboardJson(
  options: LeaderboardExportOptions = {}
): Promise<string> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      let results: LeaderboardEntry[] = req.result || [];

      if (options.difficulty) {
        results = results.filter((r) => r.difficulty === options.difficulty);
      }

      // Sort by difficulty, then fastest time
      results.sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
          return a.difficulty.localeCompare(b.difficulty);
        }
        return a.timeSeconds - b.timeSeconds;
      });

      // Strip photo if not requested
      if (!options.includePhotos) {
        results = results.map((entry) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { photo, ...rest } = entry;
          return rest as LeaderboardEntry;
        });
      }

      const exportPayload = {
        event: 'Ziarah Kasih & Cakna Komuniti 2026',
        project: 'UTM Gesture Quest V3.5',
        exportedAt: new Date().toISOString(),
        totalRecords: results.length,
        includePhotos: !!options.includePhotos,
        records: results,
      };

      resolve(JSON.stringify(exportPayload, null, 2));
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Export leaderboard data as CSV spreadsheet string (Privacy safe: excludes photo base64)
 */
export async function exportLeaderboardCsv(
  options: LeaderboardExportOptions = {}
): Promise<string> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      let results: LeaderboardEntry[] = req.result || [];

      if (options.difficulty) {
        results = results.filter((r) => r.difficulty === options.difficulty);
      }

      // Sort by difficulty, then fastest time
      results.sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
          return a.difficulty.localeCompare(b.difficulty);
        }
        return a.timeSeconds - b.timeSeconds;
      });

      const headers = [
        'ID',
        'Difficulty',
        'Nickname',
        'TimeSeconds',
        'ControlMode',
        'HasPhoto',
        'CreatedAt',
      ];

      const rows = results.map((entry) => {
        const escapedNickname = `"${(entry.nickname || '').replace(/"/g, '""')}"`;
        const hasPhoto = entry.photo ? 'YES' : 'NO';
        return [
          entry.id,
          entry.difficulty,
          escapedNickname,
          entry.timeSeconds.toFixed(2),
          entry.controlMode,
          hasPhoto,
          entry.createdAt,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      resolve(csvContent);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Triggers a browser download of the exported string
 */
export function downloadExportFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

