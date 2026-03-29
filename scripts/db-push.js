#!/usr/bin/env node
// Runs `prisma db push` with the correct DATABASE_URL for the environment.
// - On Vercel (Turso): constructs a libsql URL from TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
// - Locally: uses DATABASE_URL as-is (file:./prisma/dev.db)

const { execSync } = require("child_process");

const tursoUrl   = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let dbUrl = process.env.DATABASE_URL;

if (tursoUrl && tursoToken) {
  const sep = tursoUrl.includes("?") ? "&" : "?";
  dbUrl = `${tursoUrl}${sep}authToken=${tursoToken}`;
  console.log("→ Pushing schema to Turso production database…");
} else {
  console.log("→ Pushing schema to local SQLite database…");
}

if (!dbUrl) {
  console.log("→ No DATABASE_URL set, skipping db push.");
  process.exit(0);
}

execSync("npx prisma db push --accept-data-loss", {
  env:   { ...process.env, DATABASE_URL: dbUrl },
  stdio: "inherit",
});
