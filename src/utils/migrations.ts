import { migrate } from "postgres-migrations";
import { Client } from "pg";
require("dotenv").config();

export async function applyMigrations(): Promise<void> {
  console.log("Applying migrations");

  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
  };

  console.log(dbConfig);

  const client = new Client(dbConfig);
  try {
    await client.connect();
    await migrate({ client }, "./migrations");
    console.log("after migrate");
  } finally {
    console.log("finally");
    await client.end();
  }
  console.log("Finished applying migrations");
}
