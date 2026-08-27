import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const protocolPath = path.join(root, "qa", "protocol", "qa-protocol.json");
const csvPath = path.join(root, "qa", "protocol", "qa-protocol.csv");
const markdownPath = path.join(root, "docs", "qa-protocol-2000.md");

for (const file of [protocolPath, csvPath, markdownPath]) {
  if (!fs.existsSync(file)) throw new Error(`Required QA artifact is missing: ${path.relative(root, file)}`);
}

const protocol = JSON.parse(fs.readFileSync(protocolPath, "utf8"));
const checks = protocol.checks ?? [];
const ids = checks.map(check => check.id);
const instructionPairs = checks.map(check => `${check.instruction} ${check.expected}`);
const p0Checks = checks.filter(check => check.priority === "P0");
const loginChecks = checks.filter(check => check.domainSlug.startsWith("login-"));
const accountAndSessionChecks = checks.filter(check =>
  ["account-bootstrap-recovery", "session-security", "invitation-password"].includes(check.domainSlug)
);

const assertions = [
  [protocol.totalChecks === 2000, `Protocol totalChecks must be 2000, received ${protocol.totalChecks}`],
  [checks.length === 2000, `Protocol checks array must contain 2000 rows, received ${checks.length}`],
  [protocol.summary?.length === 25, `Protocol must contain 25 domains, received ${protocol.summary?.length}`],
  [new Set(ids).size === 2000, "Every QA check must have a unique ID"],
  [new Set(instructionPairs).size === 2000, "Every QA instruction and expected outcome pair must be unique"],
  [protocol.summary?.every(item => item.checks === 80), "Every domain must contain exactly 80 checks"],
  [loginChecks.length === 160, `Login-specific domains must contain 160 checks, received ${loginChecks.length}`],
  [accountAndSessionChecks.length === 240, `Account, session, and invitation domains must contain 240 checks, received ${accountAndSessionChecks.length}`],
  [p0Checks.length >= 700, `At least 700 checks must be P0; received ${p0Checks.length}`],
  [checks.every(check => typeof check.releaseBlocking === "boolean"), "Every check must define releaseBlocking"],
  [checks.every(check => check.status === "not-run"), "Generated checks must begin with status not-run"],
  [checks.every(check => check.evidenceRequired), "Every check must define evidence requirements"],
];

for (const [passed, message] of assertions) {
  if (!passed) throw new Error(message);
}

const corpus = [
  fs.readFileSync(protocolPath, "utf8"),
  fs.readFileSync(csvPath, "utf8"),
  fs.readFileSync(markdownPath, "utf8"),
].join("\n");

const forbiddenPatterns = [
  /ghp_[A-Za-z0-9]{20,}/,
  /MYSQL_ROOT_PASSWORD\s*=\s*["']?[^${\s]/,
  /JWT_SECRET\s*=\s*["']?[^${\s]/,
  /BUNNY_STORAGE_ACCESS_KEY\s*=\s*["']?[A-Za-z0-9]/,
  /lovelightmagic/i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) throw new Error(`QA artifacts contain a forbidden secret pattern: ${pattern}`);
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      totalChecks: checks.length,
      domains: protocol.summary.length,
      p0Checks: p0Checks.length,
      loginChecks: loginChecks.length,
      accountSessionInvitationChecks: accountAndSessionChecks.length,
    },
    null,
    2
  )
);
