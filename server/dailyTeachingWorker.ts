import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import type { DailyTeaching } from "../drizzle/schema";
import { calculateNextDueAt, dailySequenceForDate } from "./dailyTeaching";
import { sendDailyTeachingEmail } from "./dailyTeachingMailer";

const LOCK_NAME = "susan_membership_daily_teaching_reminders_v1";
const POLL_INTERVAL_MS = 15 * 60 * 1000;
const START_DELAY_MS = 15_000;

interface LockRow extends RowDataPacket {
  acquired: number;
}

interface PreferenceRow extends RowDataPacket {
  id: number;
  userId: number;
  frequency: "daily" | "weekly";
  timezone: string;
  preferredHour: number;
  nextDueAt: Date;
  email: string;
  name: string | null;
}

interface TeachingRow extends RowDataPacket, DailyTeaching {}

interface DeliveryRow extends RowDataPacket {
  id: number;
  status: "pending" | "sending" | "sent" | "skipped" | "failed";
  attemptCount: number;
}

function isConfigured() {
  return ["DATABASE_URL", "SMTP_HOST", "SMTP2GO_USER", "SMTP2GO_PASS", "SMTP_FROM_EMAIL"].every(name => Boolean(process.env[name]?.trim()));
}

export async function processDueDailyTeachingReminders(now = new Date()) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for reminder delivery");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  let lockAcquired = false;
  const summary = { due: 0, sent: 0, failed: 0, skipped: 0 };
  try {
    const [lockRows] = await connection.query<LockRow[]>("SELECT GET_LOCK(?, 0) AS acquired", [LOCK_NAME]);
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) return { ...summary, locked: true };

    const [preferences] = await connection.execute<PreferenceRow[]>(
      `SELECT p.id, p.userId, p.frequency, p.timezone, p.preferredHour, p.nextDueAt,
              u.email, u.name
         FROM daily_teaching_preferences p
         INNER JOIN users u ON u.id = p.userId
         INNER JOIN memberships m ON m.userId = p.userId
        WHERE p.frequency IN ('daily', 'weekly')
          AND p.nextDueAt IS NOT NULL
          AND p.nextDueAt <= ?
          AND u.accountStatus = 'active'
          AND m.status = 'active'
          AND u.email IS NOT NULL
        ORDER BY p.nextDueAt ASC
        LIMIT 100`,
      [now]
    );
    summary.due = preferences.length;

    for (const preference of preferences) {
      const frequency: "daily" | "weekly" = preference.frequency === "weekly" ? "weekly" : "daily";
      const sequence = dailySequenceForDate(now);
      const [teachingRows] = await connection.execute<TeachingRow[]>(
        "SELECT * FROM daily_teachings WHERE sequence = ? AND status = 'published' LIMIT 1",
        [sequence]
      );
      const teaching = teachingRows[0];
      if (!teaching) {
        summary.failed += 1;
        continue;
      }
      const scheduledDate = now.toISOString().slice(0, 10);
      await connection.execute<ResultSetHeader>(
        `INSERT IGNORE INTO daily_teaching_deliveries
          (userId, dailyTeachingId, scheduledDate, frequency, status, provider, attemptCount)
         VALUES (?, ?, ?, ?, 'pending', 'smtp2go', 0)`,
        [preference.userId, teaching.id, scheduledDate, frequency]
      );
      const [deliveryRows] = await connection.execute<DeliveryRow[]>(
        `SELECT id, status, attemptCount FROM daily_teaching_deliveries
          WHERE userId = ? AND dailyTeachingId = ? AND scheduledDate = ? LIMIT 1`,
        [preference.userId, teaching.id, scheduledDate]
      );
      const delivery = deliveryRows[0];
      if (!delivery || delivery.status === "sent" || delivery.status === "sending" || Number(delivery.attemptCount) >= 3) {
        summary.skipped += 1;
        continue;
      }
      const [claim] = await connection.execute<ResultSetHeader>(
        `UPDATE daily_teaching_deliveries
            SET status = 'sending', attemptCount = attemptCount + 1, errorMessage = NULL
          WHERE id = ? AND status IN ('pending', 'failed')`,
        [delivery.id]
      );
      if (!claim.affectedRows) {
        summary.skipped += 1;
        continue;
      }

      try {
        const sent = await sendDailyTeachingEmail({
          teaching,
          recipientEmail: preference.email,
          recipientName: preference.name,
        });
        const nextDueAt = calculateNextDueAt(frequency, preference.timezone, Number(preference.preferredHour), new Date(now.getTime() + 60_000));
        await connection.beginTransaction();
        try {
          await connection.execute<ResultSetHeader>(
            "UPDATE daily_teaching_deliveries SET status = 'sent', providerMessageId = ?, sentAt = ?, errorMessage = NULL WHERE id = ?",
            [sent.messageId || null, now, delivery.id]
          );
          await connection.execute<ResultSetHeader>(
            "UPDATE daily_teaching_preferences SET lastSentAt = ?, nextDueAt = ? WHERE id = ?",
            [now, nextDueAt, preference.id]
          );
          await connection.commit();
          summary.sent += 1;
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown SMTP delivery failure";
        await connection.execute<ResultSetHeader>(
          "UPDATE daily_teaching_deliveries SET status = 'failed', errorMessage = ? WHERE id = ?",
          [message, delivery.id]
        );
        summary.failed += 1;
      }
    }
    return { ...summary, locked: false };
  } finally {
    if (lockAcquired) await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => undefined);
    await connection.end();
  }
}

export function startDailyTeachingReminderWorker() {
  if (process.env.NODE_ENV !== "production" || process.env.REMINDER_WORKER_ENABLED === "false") return;
  if (!isConfigured()) {
    console.warn("Daily Teaching reminder worker is disabled because its database or SMTP configuration is incomplete.");
    return;
  }
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await processDueDailyTeachingReminders();
      if (result.due || result.failed) console.log("Daily Teaching reminder pass", result);
    } catch (error) {
      console.error("Daily Teaching reminder pass failed", error instanceof Error ? error.message : error);
    } finally {
      running = false;
    }
  };
  const startTimer = setTimeout(run, START_DELAY_MS);
  startTimer.unref();
  const interval = setInterval(run, POLL_INTERVAL_MS);
  interval.unref();
}
