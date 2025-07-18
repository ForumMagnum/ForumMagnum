import { ckEditorTokenHandler } from "@/server/ckEditor/ckEditorToken";
import { initDatabases, initSettings } from "@/server/serverStartup";
import type { NextRequest } from "next/server";

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_READ_URL || '',
});
await initSettings();

export async function GET(req: NextRequest) {
  return ckEditorTokenHandler(req);
}
