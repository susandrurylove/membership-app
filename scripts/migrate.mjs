import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const database = drizzle(connection);
  await migrate(database, { migrationsFolder: "./drizzle" });
  console.log("Database migrations completed successfully.");
} finally {
  await connection.end();
}
