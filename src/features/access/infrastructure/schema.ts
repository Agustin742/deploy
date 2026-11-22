import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Emails allowed to sign in. The primary key is the normalized (trimmed, lowercase) email, so a
 * duplicate insert is impossible and lookups are exact. Owners (OWNER_EMAILS) are not stored here.
 */
export const allowedEmails = mysqlTable("allowed_emails", {
  email: varchar("email", { length: 255 }).primaryKey(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  /** Email of the owner who added it, when known. */
  addedBy: varchar("added_by", { length: 255 }),
});
