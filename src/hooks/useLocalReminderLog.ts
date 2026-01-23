type ReminderStage = 7 | 3 | 1 | 0;
type ReminderKey = string; // `${type}:${id}:${stage}`

const STORAGE_KEY = "mvp:reminders:v1";

function readStore(): Record<ReminderKey, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed) return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeStore(store: Record<ReminderKey, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function hasShownReminder(key: ReminderKey, todayIso: string) {
  const store = readStore();
  return store[key] === todayIso;
}

export function markReminderShown(key: ReminderKey, todayIso: string) {
  const store = readStore();
  store[key] = todayIso;
  writeStore(store);
}

export type { ReminderStage, ReminderKey };
