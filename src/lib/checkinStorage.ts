const STORAGE_KEY = 'fitx_saved_checkin';

export interface SavedCheckIn {
  memberId: string;
  memberName?: string;
  savedAt: string;
}

export function loadSavedCheckIn(): SavedCheckIn | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCheckIn;
  } catch {
    return null;
  }
}

export function saveCheckIn(data: SavedCheckIn) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSavedCheckIn() {
  localStorage.removeItem(STORAGE_KEY);
}
