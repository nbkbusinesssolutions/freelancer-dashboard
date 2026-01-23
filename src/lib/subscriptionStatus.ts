import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { AISubscriptionItem, SubscriptionComputedStatus } from "@/lib/types";

export function computeSubscriptionStatus(sub: AISubscriptionItem, now = new Date()): SubscriptionComputedStatus {
  if (sub.manualStatus === "Cancelled") return "Cancelled";
  if (!sub.cancelByDate) return "Active";

  const cancelBy = startOfDay(parseISO(sub.cancelByDate));
  const today = startOfDay(now);
  const daysLeft = differenceInCalendarDays(cancelBy, today);

  if (daysLeft < 0) return "Expired";
  if (daysLeft <= 7) return "Expiring Soon";
  return "Active";
}

export function getDaysLeft(cancelByDate: string, now = new Date()) {
  const cancelBy = startOfDay(parseISO(cancelByDate));
  const today = startOfDay(now);
  return differenceInCalendarDays(cancelBy, today);
}
