import { migrate } from "postgres-migrations";
import { Client } from "pg";
require("dotenv").config();

export async function applyMigrations(): Promise<void> {
  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
  };

  const client = new Client(dbConfig);
  try {
    await client.connect();
    await migrate({ client }, "./migrations");
  } finally {
    await client.end();
  }
}
