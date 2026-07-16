// One-off bootstrap: create (or promote) the first admin account.
// Usage: node --env-file=.env.local scripts/create-admin.mjs <username> <password>
import postgres from "postgres"
import bcrypt from "bcryptjs"

const [username, password] = process.argv.slice(2)

if (!username || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <username> <password>")
  process.exit(1)
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.")
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/create-admin.mjs ...")
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL)

try {
  const normalized = username.trim().toLowerCase()
  const passwordHash = await bcrypt.hash(password, 10)

  const rows = await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${normalized}, ${passwordHash}, 'admin')
    ON CONFLICT (username)
    DO UPDATE SET password_hash = ${passwordHash}, role = 'admin'
    RETURNING id, username, role
  `

  console.log(`Admin ready: ${rows[0].username} (${rows[0].role})`)
} finally {
  await sql.end()
}
