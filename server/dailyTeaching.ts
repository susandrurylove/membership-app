import { and, eq } from "drizzle-orm";
import { dailyTeachingPreferences, dailyTeachings } from "../drizzle/schema";
import { getDb } from "./db";

export const DAILY_TEACHING_TIMEZONE = "America/Denver";
export const DAILY_TEACHING_EPOCH = "2026-01-01";
export type ReminderFrequency = "off" | "daily" | "weekly";

export function isValidTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

function dateKeyInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dailySequenceForDate(date: Date = new Date(), timezone = DAILY_TEACHING_TIMEZONE) {
  const currentKey = dateKeyInTimezone(date, timezone);
  const current = Date.parse(`${currentKey}T00:00:00Z`);
  const epoch = Date.parse(`${DAILY_TEACHING_EPOCH}T00:00:00Z`);
  const elapsedDays = Math.floor((current - epoch) / 86_400_000);
  return ((elapsedDays % 365) + 365) % 365 + 1;
}

function zonedHourToUtc(date: Date, timezone: string, preferredHour: number) {
  const localDate = dateKeyInTimezone(date, timezone);
  const [year, month, day] = localDate.split("-").map(Number);
  let candidate = new Date(Date.UTC(year, month - 1, day, preferredHour, 0, 0));
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);
    const values = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
    const represented = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
    const target = Date.UTC(year, month - 1, day, preferredHour, 0, 0);
    candidate = new Date(candidate.getTime() + (target - represented));
  }
  return candidate;
}

export function calculateNextDueAt(
  frequency: Exclude<ReminderFrequency, "off">,
  timezone: string,
  preferredHour: number,
  from: Date = new Date()
) {
  let candidate = zonedHourToUtc(from, timezone, preferredHour);
  if (candidate.getTime() <= from.getTime()) {
    candidate = new Date(candidate.getTime() + (frequency === "daily" ? 1 : 7) * 86_400_000);
  }
  return candidate;
}

export async function getDailyTeachingPreference(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dailyTeachingPreferences)
    .where(eq(dailyTeachingPreferences.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getDailyTeachingBySlug(slug: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(dailyTeachings)
    .where(and(eq(dailyTeachings.slug, slug), eq(dailyTeachings.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCurrentDailyTeaching(userId: number, now: Date = new Date()) {
  const db = await requireDb();
  const sequence = dailySequenceForDate(now);
  const [teachingRows, preference] = await Promise.all([
    db
      .select()
      .from(dailyTeachings)
      .where(and(eq(dailyTeachings.sequence, sequence), eq(dailyTeachings.status, "published")))
      .limit(1),
    getDailyTeachingPreference(userId),
  ]);
  return {
    teaching: teachingRows[0] ?? null,
    sequence,
    dateKey: dateKeyInTimezone(now, DAILY_TEACHING_TIMEZONE),
    preference,
    shouldPrompt: !preference || (preference.frequency === "off" && !preference.promptDismissedAt),
  };
}

export async function saveDailyTeachingPreference(input: {
  userId: number;
  frequency: ReminderFrequency;
  timezone: string;
  preferredHour: number;
}) {
  if (!isValidTimeZone(input.timezone)) throw new Error("Invalid timezone");
  const db = await requireDb();
  const now = new Date();
  const nextDueAt = input.frequency === "off"
    ? null
    : calculateNextDueAt(input.frequency, input.timezone, input.preferredHour, now);
  await db
    .insert(dailyTeachingPreferences)
    .values({
      userId: input.userId,
      frequency: input.frequency,
      timezone: input.timezone,
      preferredHour: input.preferredHour,
      promptDismissedAt: now,
      nextDueAt,
    })
    .onDuplicateKeyUpdate({
      set: {
        frequency: input.frequency,
        timezone: input.timezone,
        preferredHour: input.preferredHour,
        promptDismissedAt: now,
        nextDueAt,
      },
    });
  return getDailyTeachingPreference(input.userId);
}

export async function dismissDailyTeachingPrompt(userId: number) {
  const db = await requireDb();
  const now = new Date();
  await db
    .insert(dailyTeachingPreferences)
    .values({ userId, frequency: "off", promptDismissedAt: now, nextDueAt: null })
    .onDuplicateKeyUpdate({ set: { promptDismissedAt: now } });
  return getDailyTeachingPreference(userId);
}
