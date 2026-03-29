#!/usr/bin/env node
// Applies schema migrations to Turso via its HTTP API (prisma db push doesn't
// support libsql URLs at the CLI level — only the runtime driver adapter does).
// Safe to re-run: ALTER TABLE errors are ignored if column already exists.

const https = require("https");

const tursoUrl   = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.log("→ No Turso credentials found, skipping migration (local dev).");
  process.exit(0);
}

// Convert libsql://xxx.turso.io → https://xxx.turso.io/v2/pipeline
const apiUrl = tursoUrl.replace(/^libsql:\/\//, "https://") + "/v2/pipeline";

// Each statement is run individually; errors are caught per-statement.
const statements = [
  // WeeklyGoal table
  `CREATE TABLE IF NOT EXISTS WeeklyGoal (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    weekStart DATETIME NOT NULL,
    title TEXT NOT NULL,
    isComplete INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`,
  "CREATE INDEX IF NOT EXISTS WeeklyGoal_userId_weekStart_idx ON WeeklyGoal(userId, weekStart)",
  // New columns — will fail silently if already present
  "ALTER TABLE User ADD COLUMN weeklyGoalsTarget INTEGER NOT NULL DEFAULT 5",
  "ALTER TABLE Item ADD COLUMN weeklyGoalId TEXT",
  "CREATE INDEX IF NOT EXISTS Item_weeklyGoalId_idx ON Item(weeklyGoalId)",
];

async function runStatement(sql) {
  const body = JSON.stringify({
    requests: [{ type: "execute", stmt: { sql } }],
  });

  return new Promise((resolve) => {
    const req = https.request(
      apiUrl,
      {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${tursoToken}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const result = json.results?.[0];
            if (result?.type === "error") {
              const msg = result.error?.message ?? "";
              // Ignore "already exists" / "duplicate column" errors — idempotent
              if (/already exists|duplicate column/i.test(msg)) {
                resolve({ ok: true, skipped: true, msg });
              } else {
                resolve({ ok: false, msg });
              }
            } else {
              resolve({ ok: true });
            }
          } catch {
            resolve({ ok: false, msg: data });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ ok: false, msg: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("→ Applying schema migrations to Turso…");
  let failed = false;

  for (const sql of statements) {
    const preview = sql.trim().split("\n")[0].slice(0, 60);
    const result  = await runStatement(sql);
    if (result.skipped) {
      console.log(`  ✓ (already applied) ${preview}`);
    } else if (result.ok) {
      console.log(`  ✓ ${preview}`);
    } else {
      console.error(`  ✗ FAILED: ${preview}`);
      console.error(`    ${result.msg}`);
      failed = true;
    }
  }

  if (failed) {
    console.error("Migration had failures — aborting build.");
    process.exit(1);
  }

  console.log("→ Migration complete.");
}

main();
