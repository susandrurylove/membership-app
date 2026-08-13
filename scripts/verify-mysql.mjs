import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const expectedTables = [
  "activity_events",
  "app_integrations",
  "app_launch_grants",
  "audit_events",
  "content_categories",
  "course_enrollments",
  "course_progress",
  "course_sections",
  "courses",
  "invitation_tokens",
  "lessons",
  "media_assets",
  "memberships",
  "password_credentials",
  "session_tokens",
  "teachings",
  "users",
];

const connection = await mysql.createConnection(databaseUrl);
try {
  const [[server]] = await connection.query(
    "SELECT DATABASE() AS databaseName, VERSION() AS serverVersion"
  );
  const [rows] = await connection.query(
    "SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
  );
  const actualTables = new Set(rows.map(row => row.tableName));
  const missingTables = expectedTables.filter(table => !actualTables.has(table));
  if (missingTables.length) {
    throw new Error(`Missing required tables: ${missingTables.join(", ")}`);
  }

  console.log(JSON.stringify({
    connected: true,
    databaseName: server.databaseName,
    serverFamily: String(server.serverVersion).toLowerCase().includes("mysql") ? "MySQL" : "MySQL-compatible",
    requiredTables: expectedTables.length,
    missingTables,
  }));
} finally {
  await connection.end();
}
