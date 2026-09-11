import "dotenv/config";
import nodemailer from "nodemailer";

const requiredNames = ["SMTP_HOST", "SMTP_PORT", "SMTP2GO_USER", "SMTP2GO_PASS", "SMTP_FROM_EMAIL"];
const missing = requiredNames.filter(name => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing SMTP2GO configuration: ${missing.join(", ")}`);
const port = Number(process.env.SMTP_PORT || 2525);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: { user: process.env.SMTP2GO_USER, pass: process.env.SMTP2GO_PASS },
  connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
  greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
  socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20_000),
});
await transporter.verify();
console.log(JSON.stringify({ status: "verified", provider: "smtp2go", senderConfigured: true }));
transporter.close();
