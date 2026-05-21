/**
 * Shared helpers for narrowing Postgres errors. Driver errors carry the
 * standard SQLSTATE code on `err.code` — see
 * https://www.postgresql.org/docs/current/errcodes-appendix.html.
 */

export const POSTGRES_UNIQUE_VIOLATION = "23505";

export function isPostgresUniqueViolation(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}
