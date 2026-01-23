import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export type DateExpiryStatus = "Active" | "Expiring Soon" | "Expired";

export const DEFAULT_REMINDER_THRESHOLDS = [30, 14, 7, 3, 1, 0] as const;
export type ReminderThreshold = (typeof DEFAULT_REMINDER_THRESHOLDS)[number];

// Keep consistent with ReminderStage in useLocalReminderLog.
export type DateReminderStage = ReminderThreshold | -1;

export function getDaysLeftByDate(targetIsoDate: string, now = new Date()): number {
  const target = startOfDay(parseISO(targetIsoDate));
  const today = startOfDay(now);
  return differenceInCalendarDays(target, today);
}

export function computeDateExpiry(
  targetIsoDate: string | null | undefined,
  windowDays: number,
  now = new Date()
): { daysLeft: number; status: DateExpiryStatus } | null {
  if (!targetIsoDate) return null;
  const daysLeft = getDaysLeftByDate(targetIsoDate, now);
  if (daysLeft < 0) return { daysLeft, status: "Expired" };
  if (daysLeft <= windowDays) return { daysLeft, status: "Expiring Soon" };
  return { daysLeft, status: "Active" };
}

export function matchReminderStage(daysLeft: number, thresholds = DEFAULT_REMINDER_THRESHOLDS): DateReminderStage | null {
  if (daysLeft < 0) return -1;
  return (thresholds as readonly number[]).includes(daysLeft) ? (daysLeft as DateReminderStage) : null;
}

export function stageLabel(stage: DateReminderStage) {
  if (stage === -1) return "Overdue";
  if (stage === 0) return "Due today";
  return `${stage} day reminder`;
}

export function stagePriority(stage: DateReminderStage): number {
  // smaller = more urgent
  if (stage === -1) return 0;
  if (stage === 0) return 1;
  if (stage === 1) return 2;
  if (stage === 3) return 3;
  if (stage === 7) return 4;
  if (stage === 14) return 5;
  return 6; // 30
}
