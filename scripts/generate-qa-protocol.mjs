import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const protocolDir = path.join(root, "qa", "protocol");
const docsDir = path.join(root, "docs");
fs.mkdirSync(protocolDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const conditions = [
  {
    key: "nominal",
    label: "the expected valid state",
    expectation: "complete successfully with accurate, user-visible confirmation",
  },
  {
    key: "invalid",
    label: "invalid, missing, or unauthorized input",
    expectation: "fail closed with a calm, specific, non-enumerating error",
  },
  {
    key: "boundary",
    label: "minimum, maximum, empty, duplicate, expired, and unusual boundary values",
    expectation: "handle every boundary deterministically without truncation, corruption, or ambiguous state",
  },
  {
    key: "dependency_failure",
    label: "a database, storage, network, or downstream dependency failure",
    expectation: "preserve data integrity, expose no secret, and provide a recoverable failure state",
  },
  {
    key: "recovery",
    label: "retry, refresh, reconnect, rollback, and recovery after interruption",
    expectation: "recover idempotently without duplicate records, stale authorization, or hidden partial work",
  },
];

const domains = [
  {
    slug: "login-credentials",
    title: "Login Credentials",
    priority: "P0",
    controls: ["email normalization", "password verification", "credential submission", "post-login identity resolution"],
    contexts: ["desktop keyboard login", "mobile touch login", "direct tRPC login request", "fresh browser session after deployment"],
    expected: "authenticate only the intended account, issue the correct session, and never log or echo the password",
  },
  {
    slug: "login-validation",
    title: "Login Validation and Feedback",
    priority: "P0",
    controls: ["required-field validation", "email-format handling", "password-length handling", "generic authentication feedback"],
    contexts: ["login form before submission", "login form during submission", "login form after server response", "login under slow network conditions"],
    expected: "keep the form usable, prevent account enumeration, preserve entered email when appropriate, and clearly expose progress or failure",
  },
  {
    slug: "account-bootstrap-recovery",
    title: "Account Bootstrap and Recovery",
    priority: "P0",
    controls: ["administrator bootstrap", "member account creation", "password assignment", "authorized account recovery"],
    contexts: ["empty production database", "existing user record", "duplicate email record", "post-recovery clean deployment"],
    expected: "create or update only authorized accounts, store only a salted hash, preserve membership data, and leave no public recovery mechanism",
  },
  {
    slug: "session-security",
    title: "Session Lifecycle and Security",
    priority: "P0",
    controls: ["session issuance", "cookie attributes", "session lookup", "logout and revocation"],
    contexts: ["same-tab navigation", "new browser tab", "expired session", "multiple concurrent devices"],
    expected: "enforce secure HttpOnly session handling, correct expiration, immediate revocation, and role-consistent identity",
  },
  {
    slug: "invitation-password",
    title: "Invitation and Password Setup",
    priority: "P0",
    controls: ["invitation creation", "token validation", "password setup", "token consumption"],
    contexts: ["administrator member workflow", "accept-invitation page", "expired invitation", "refreshed invitation link"],
    expected: "allow one authorized password setup, activate the intended account, and reject reused, malformed, or expired tokens",
  },
  {
    slug: "member-authorization",
    title: "Member Authorization",
    priority: "P1",
    controls: ["protected route entry", "protected query execution", "protected mutation execution", "member-visible navigation"],
    contexts: ["active member", "signed-out visitor", "paused or expired member", "administrator using member features"],
    expected: "grant only current entitled access and deny unauthorized requests before protected data is read or changed",
  },
  {
    slug: "admin-authorization",
    title: "Administrator Authorization",
    priority: "P0",
    controls: ["admin route entry", "admin query execution", "admin mutation execution", "admin navigation visibility"],
    contexts: ["active administrator", "active ordinary member", "signed-out visitor", "suspended administrator"],
    expected: "restrict every management capability to a non-suspended administrator and reject role escalation",
  },
  {
    slug: "membership-entitlements",
    title: "Membership Entitlements",
    priority: "P1",
    controls: ["status evaluation", "start-date evaluation", "end and grace-date evaluation", "tier presentation"],
    contexts: ["active membership", "future membership", "paused or cancelled membership", "expired membership"],
    expected: "derive portal access from persisted entitlement state consistently across server, navigation, media, and SSO",
  },
  {
    slug: "database-integrity",
    title: "Database Integrity",
    priority: "P0",
    controls: ["user uniqueness", "membership uniqueness", "foreign-key behavior", "transaction rollback"],
    contexts: ["account write", "membership write", "session or token write", "content write"],
    expected: "preserve schema invariants, timestamps, unique keys, references, and all-or-nothing transactional behavior",
  },
  {
    slug: "migrations-boot",
    title: "Migrations and Application Boot",
    priority: "P0",
    controls: ["migration discovery", "migration ordering", "schema verification", "application startup"],
    contexts: ["fresh database", "current production schema", "partially migrated schema", "restart after failed pre-deploy"],
    expected: "reach a verified schema before serving traffic and stop deployment when required tables or columns are absent",
  },
  {
    slug: "dashboard",
    title: "Member Dashboard",
    priority: "P1",
    controls: ["welcome identity", "course journey summary", "navigation cards", "recent activity"],
    contexts: ["new member with no activity", "returning member", "administrator dashboard view", "narrow mobile viewport"],
    expected: "show accurate, calm, personalized information without exposing another member’s data",
  },
  {
    slug: "teachings",
    title: "Teachings Experience",
    priority: "P1",
    controls: ["teaching listing", "category filtering", "teaching detail", "attached media rendering"],
    contexts: ["no published teachings", "one published teaching", "many teachings", "missing or archived teaching"],
    expected: "present only published authorized content with stable navigation, readable typography, and protected media",
  },
  {
    slug: "courses-progress",
    title: "Courses and Progress",
    priority: "P1",
    controls: ["course listing", "section and lesson ordering", "lesson completion", "progress calculation"],
    contexts: ["course with no lessons", "partially completed course", "fully completed course", "archived or missing course"],
    expected: "preserve deterministic ordering and user-specific progress with percentages bounded from zero to one hundred",
  },
  {
    slug: "apps-sso",
    title: "Connected Apps and SSO",
    priority: "P1",
    controls: ["integration visibility", "launch eligibility", "grant issuance", "assertion exchange"],
    contexts: ["disabled integration", "fully configured integration", "expired launch grant", "wrong audience or destination secret"],
    expected: "fail closed until configured, issue short-lived audience-bound claims, and expose no destination secret",
  },
  {
    slug: "protected-media",
    title: "Protected Media",
    priority: "P1",
    controls: ["storage-key validation", "authorized proxying", "range streaming", "public brand allowlist"],
    contexts: ["authorized member request", "signed-out request", "path traversal attempt", "Bunny storage failure"],
    expected: "serve only allowed content with correct metadata while blocking arbitrary paths and unauthorized access",
  },
  {
    slug: "admin-members",
    title: "Administrator Member Management",
    priority: "P1",
    controls: ["member listing", "member invitation", "access-state update", "invitation refresh"],
    contexts: ["empty member list", "existing member", "duplicate email", "mobile administrator layout"],
    expected: "make membership state explicit, preserve account data, and generate copyable single-use invitations without direct password exposure",
  },
  {
    slug: "admin-teachings",
    title: "Administrator Teaching Management",
    priority: "P2",
    controls: ["teaching create", "teaching edit", "publication state", "asset association"],
    contexts: ["new draft", "existing published teaching", "duplicate slug", "unsaved editor interruption"],
    expected: "preserve editorial content, validate publication requirements, and prevent duplicate or orphaned records",
  },
  {
    slug: "admin-courses",
    title: "Administrator Course Management",
    priority: "P2",
    controls: ["course create", "section editing", "lesson editing", "publication and ordering"],
    contexts: ["new draft course", "multi-section course", "duplicate lesson slug", "editor recovery after interruption"],
    expected: "maintain deterministic hierarchy, safe edits, valid publication state, and consistent member visibility",
  },
  {
    slug: "admin-media",
    title: "Administrator Media Management",
    priority: "P1",
    controls: ["upload validation", "storage write", "asset metadata", "asset selection"],
    contexts: ["valid small upload", "large or unsupported file", "duplicate storage key", "storage dependency failure"],
    expected: "accept only authorized supported media, preserve metadata, and fail without orphaned database or storage records",
  },
  {
    slug: "responsive-layout",
    title: "Responsive Layout",
    priority: "P1",
    controls: ["navigation layout", "card and grid layout", "form and dialog layout", "table and media overflow"],
    contexts: ["320px mobile", "430px large mobile", "768px tablet", "1440px desktop"],
    expected: "avoid clipping, overlap, unreachable controls, accidental horizontal scrolling, or unreadable line lengths",
  },
  {
    slug: "accessibility",
    title: "Accessibility and Inclusive Interaction",
    priority: "P1",
    controls: ["keyboard order", "accessible naming", "focus management", "contrast and reduced motion"],
    contexts: ["keyboard-only use", "screen-reader semantics", "high zoom", "reduced-motion preference"],
    expected: "keep every critical task perceivable, operable, understandable, and robust without pointer-only dependence",
  },
  {
    slug: "visual-brand",
    title: "Susan Drury Visual Brand",
    priority: "P2",
    controls: ["brand tokens", "typographic hierarchy", "button and border styling", "mandala and imagery use"],
    contexts: ["login", "member dashboard", "content pages", "administrator workspace"],
    expected: "use the approved Lora, ivory, navy, gold, teal, pill, hairline, and mandala system consistently without decorative overload",
  },
  {
    slug: "security-privacy",
    title: "Security and Privacy",
    priority: "P0",
    controls: ["secret handling", "input and path handling", "response minimization", "audit and session revocation"],
    contexts: ["browser request", "API request", "deployment log", "repository and generated artifacts"],
    expected: "expose no password, token, private URL, storage secret, or cross-user data and leave an auditable safe failure path",
  },
  {
    slug: "performance-reliability",
    title: "Performance and Reliability",
    priority: "P2",
    controls: ["initial load", "query and mutation latency", "asset transfer", "retry and backoff"],
    contexts: ["fast network", "slow network", "intermittent network", "concurrent member activity"],
    expected: "remain responsive, avoid duplicate work, bound retries, and communicate progress without blocking critical navigation",
  },
  {
    slug: "deployment-observability",
    title: "Deployment and Observability",
    priority: "P0",
    controls: ["build and type check", "pre-deploy migration", "health check", "rollback and smoke verification"],
    contexts: ["normal main-branch deployment", "failed build", "failed database verification", "clean rollback or redeploy"],
    expected: "promote only a verified release, report database-aware health, and make production failures diagnosable without leaking secrets",
  },
];

if (domains.length !== 25) throw new Error(`Expected 25 domains, received ${domains.length}`);

function automationLayer(domain, context, condition) {
  const text = `${domain.slug} ${context} ${condition}`;
  if (/deployment|health|production|fresh browser/.test(text)) return "production-smoke";
  if (/mobile|tablet|desktop|viewport|login form|keyboard|screen-reader|zoom|motion/.test(text)) return "browser-e2e";
  if (/database|schema|migration|storage|API|tRPC|transaction|session|token/.test(text)) return "integration";
  if (/brand|source|repository|artifact|build|type check/.test(text)) return "static-analysis";
  return "unit-or-component";
}

const checks = [];
for (const domain of domains) {
  let domainSequence = 0;
  for (const control of domain.controls) {
    for (const context of domain.contexts) {
      for (const condition of conditions) {
        domainSequence += 1;
        const id = `QA-${domain.slug.toUpperCase()}-${String(domainSequence).padStart(3, "0")}`;
        checks.push({
          id,
          priority: domain.priority,
          domain: domain.title,
          domainSlug: domain.slug,
          control,
          context,
          condition: condition.key,
          automationLayer: automationLayer(domain, context, condition.key),
          instruction: `In ${context}, verify ${control} under ${condition.label}.`,
          expected: `The membership app must ${domain.expected}; it must ${condition.expectation}.`,
          evidenceRequired: "Automated assertion, screenshot, API response, database assertion, or documented manual observation",
          releaseBlocking: domain.priority === "P0" || (domain.priority === "P1" && condition.key !== "nominal"),
          status: "not-run",
        });
      }
    }
  }
}

if (checks.length !== 2000) throw new Error(`Expected 2000 checks, received ${checks.length}`);
if (new Set(checks.map(check => check.id)).size !== checks.length) throw new Error("Duplicate QA IDs detected");
if (new Set(checks.map(check => `${check.instruction} ${check.expected}`)).size !== checks.length) {
  throw new Error("Duplicate QA instructions detected");
}

const summary = domains.map(domain => ({
  domain: domain.title,
  slug: domain.slug,
  priority: domain.priority,
  checks: checks.filter(check => check.domainSlug === domain.slug).length,
  releaseBlocking: checks.filter(check => check.domainSlug === domain.slug && check.releaseBlocking).length,
}));

const protocol = {
  schemaVersion: "1.0.0",
  protocolDate: "2026-08-26",
  totalChecks: checks.length,
  releaseRule: "Every P0 check and every release-blocking P1 check must pass before production promotion.",
  summary,
  checks,
};

fs.writeFileSync(path.join(protocolDir, "qa-protocol.json"), `${JSON.stringify(protocol, null, 2)}\n`);

const csvEscape = value => `"${String(value).replaceAll('"', '""')}"`;
const csvHeaders = [
  "id",
  "priority",
  "domain",
  "control",
  "context",
  "condition",
  "automationLayer",
  "instruction",
  "expected",
  "evidenceRequired",
  "releaseBlocking",
  "status",
];
const csv = [csvHeaders.map(csvEscape).join(",")]
  .concat(checks.map(check => csvHeaders.map(header => csvEscape(check[header])).join(",")))
  .join("\n");
fs.writeFileSync(path.join(protocolDir, "qa-protocol.csv"), `${csv}\n`);

const lines = [
  "# Susan Drury Membership: 2,000-Check Quality Protocol",
  "",
  "**Author:** Manus AI",
  "",
  "> **Release rule:** Every P0 check and every release-blocking P1 check must pass before production promotion.",
  "",
  "This protocol is a traceability system, not a decorative checklist. Each instruction has a stable ID, priority, control, execution context, condition, automation layer, expected outcome, evidence requirement, and release-blocking flag. Login, account recovery, sessions, database integrity, administrator authorization, security, and deployment are deliberately P0.",
  "",
  "## Coverage Summary",
  "",
  "| Domain | Priority | Checks | Release-Blocking |",
  "|---|---:|---:|---:|",
  ...summary.map(item => `| ${item.domain} | ${item.priority} | ${item.checks} | ${item.releaseBlocking} |`),
  "",
];

for (const domain of domains) {
  lines.push(`## ${domain.title}`);
  lines.push("");
  lines.push("| ID | Priority | Control | Context | Condition | Automation | Instruction | Expected Outcome | Blocking | Status |");
  lines.push("|---|---:|---|---|---|---|---|---|---:|---|");
  for (const check of checks.filter(item => item.domainSlug === domain.slug)) {
    lines.push(
      `| ${check.id} | ${check.priority} | ${check.control} | ${check.context} | ${check.condition} | ${check.automationLayer} | ${check.instruction} | ${check.expected} | ${check.releaseBlocking ? "Yes" : "No"} | ${check.status} |`
    );
  }
  lines.push("");
}

lines.push("## Protocol Maintenance");
lines.push("");
lines.push("Run `pnpm qa:protocol` after changing the taxonomy. The generator fails unless exactly 2,000 unique checks are produced. Automated suites should reference stable QA IDs in test names or comments so evidence can be mapped back to this protocol.");
lines.push("");
fs.writeFileSync(path.join(docsDir, "qa-protocol-2000.md"), `${lines.join("\n")}\n`);

console.log(JSON.stringify({ totalChecks: checks.length, domains: domains.length, summary }, null, 2));
