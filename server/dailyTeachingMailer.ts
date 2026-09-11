import nodemailer from "nodemailer";
import type { DailyTeaching } from "../drizzle/schema";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Daily Teaching email delivery`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] as string);
}

function paragraphHtml(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .map(paragraph => `<p style="margin:0 0 18px;line-height:1.72;color:#263746;font-size:16px;">${escapeHtml(paragraph.replace(/^#+\s*/gm, "")).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function createDailyTeachingTransport() {
  const port = Number(process.env.SMTP_PORT || 2525);
  return nodemailer.createTransport({
    host: required("SMTP_HOST"),
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
      user: required("SMTP2GO_USER"),
      pass: required("SMTP2GO_PASS"),
    },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
  });
}

export function dailyTeachingEmailContent(teaching: DailyTeaching, memberName?: string | null) {
  const origin = (process.env.APP_ORIGIN || "https://membership.susandrury.com").replace(/\/$/, "");
  const url = `${origin}/daily-teachings/${encodeURIComponent(teaching.slug)}`;
  const greeting = memberName?.trim() ? `Dear ${memberName.trim().split(/\s+/)[0]},` : "Dear friend,";
  const safety = teaching.safetyNote
    ? `<div style="margin:24px 0 0;padding:16px 18px;border-left:3px solid #b79756;background:#f7f1e7;color:#44505a;font-size:13px;line-height:1.6;">${escapeHtml(teaching.safetyNote)}</div>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4efe5;font-family:Arial,sans-serif;color:#142636;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(teaching.summary)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe5;padding:24px 12px;"><tr><td align="center">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf7;border:1px solid #d8c69e;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(13,35,51,.12);">
    <tr><td><img src="${escapeHtml(teaching.imageUrl)}" alt="${escapeHtml(teaching.imageAlt)}" width="640" style="display:block;width:100%;height:auto;max-height:400px;object-fit:cover;"></td></tr>
    <tr><td style="padding:34px 36px 38px;">
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8c6e32;margin-bottom:12px;">Susan Drury · Daily Teaching</div>
      <h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.16;font-weight:500;color:#142636;margin:0 0 22px;">${escapeHtml(teaching.title)}</h1>
      <p style="margin:0 0 18px;line-height:1.72;color:#263746;font-size:16px;">${escapeHtml(greeting)}</p>
      ${paragraphHtml(teaching.body)}
      <div style="margin:24px 0;padding:20px;border-radius:14px;background:#edf4f1;border:1px solid #bdd4cb;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#416d67;margin-bottom:8px;">A moment to reflect</div>
        <div style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#183f46;">${escapeHtml(teaching.reflectionPrompt)}</div>
      </div>
      <div style="margin:24px 0;padding:20px;border-radius:14px;background:#f7f1e7;border:1px solid #d8c69e;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8c6e32;margin-bottom:8px;">Today’s practice</div>
        <div style="font-size:16px;line-height:1.65;color:#263746;">${escapeHtml(teaching.practice)}</div>
      </div>
      ${safety}
      <div style="margin-top:30px;text-align:center;"><a href="${url}" style="display:inline-block;background:#153a43;color:#fffdf7;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">Open today’s teaching</a></div>
      <p style="margin:28px 0 0;font-size:12px;line-height:1.55;color:#6d716f;">${escapeHtml(teaching.sourceNote)}</p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;color:#68737a;font-size:12px;">Manage reminder frequency inside your Susan Drury membership.</p>
  </td></tr></table></body></html>`;
  const text = `${greeting}\n\n${teaching.title}\n\n${teaching.body}\n\nA moment to reflect\n${teaching.reflectionPrompt}\n\nToday’s practice\n${teaching.practice}${teaching.safetyNote ? `\n\n${teaching.safetyNote}` : ""}\n\nOpen today’s teaching: ${url}\n\n${teaching.sourceNote}`;
  return { html, text, url };
}

export async function sendDailyTeachingEmail(input: {
  teaching: DailyTeaching;
  recipientEmail: string;
  recipientName?: string | null;
}) {
  const transporter = createDailyTeachingTransport();
  const content = dailyTeachingEmailContent(input.teaching, input.recipientName);
  const info = await transporter.sendMail({
    from: { name: process.env.SMTP_FROM_NAME?.trim() || "Susan Drury", address: required("SMTP_FROM_EMAIL") },
    to: input.recipientEmail,
    subject: `Your Daily Teaching: ${input.teaching.title}`,
    text: content.text,
    html: content.html,
  });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}
