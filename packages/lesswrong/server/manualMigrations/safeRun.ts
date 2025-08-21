// We can't assume that certain postgres functions exist because we may not have run the appropriate migration
// This wraapper runs the function and ignores if it's not defined yet

export async function safeRun(db: SqlClient | null, fn: string): Promise<void> {
  if (!db) return;

  await db.any(`DO $$
    BEGIN
      PERFORM ${fn}();
    EXCEPTION WHEN undefined_function THEN
      -- Ignore if the function hasn't been defined yet; that just means migrations haven't caught up
    END;
  $$;`);
}
