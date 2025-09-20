import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

export async function GET() {
  try {
    const db = getSqlClientOrThrow();
    await db.one('SELECT 1');
    return new Response();
  } catch (err) {
    return new Response("", { status: 500 });
  }
}
