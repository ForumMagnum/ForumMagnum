import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.simpleApiRoute;

export async function GET() {
  try {
    const db = getSqlClientOrThrow();
    await db.one('SELECT 1');
    return new Response();
  } catch (err) {
    return new Response("", { status: 500 });
  }
}
