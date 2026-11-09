/**
 * Validates the database environment. Plain validator on purpose: the project
 * has no schema library and only one variable is needed today.
 */
export function readDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const raw = env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is required (expected mysql://user:pass@host:3306/db)");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL (expected a mysql:// connection string)");
  }
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol");
  }
  return raw;
}
