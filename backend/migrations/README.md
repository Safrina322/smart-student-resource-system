# Database migrations

Plain numbered `.sql` files, applied in filename order, tracked in a
`schema_migrations` table so each one runs exactly once per database.

## Adding a migration

1. Create a new file: `NNNN_short_description.sql`, where `NNNN` is the next
   number after the highest one currently in this folder (zero-padded to 4
   digits, e.g. `0002_add_widgets_table.sql`).
2. Write plain SQL. Prefer `CREATE TABLE IF NOT EXISTS` / idempotent forms
   where practical - it's not required (the tracking table already prevents
   re-running a file), but it means a migration is also safe to hand-run
   directly against a database while debugging.
3. Statements are split on `;` - don't use semicolons inside string literals,
   comments, or stored procedure bodies in a migration file.
4. Migrations run automatically on app boot (`await runMigrations()` in
   `index.js`), or standalone via `npm run migrate`.

## What NOT to put in a migration

Seed/demo data (`seedDemoRoleAccounts`, `seedDefaultAdmin` in `index.js`)
stays separate from schema migrations - migrations change structure, seeding
changes data, and conflating the two makes it harder to reason about "what
does this database look like" independent of "what demo data happened to be
seeded when."
