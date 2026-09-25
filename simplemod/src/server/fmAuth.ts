import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getContextFromReqAndRes } from '@/server/vulcan-lib/apollo-server/context';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { refreshSettingsCaches } from '@/server/loadDatabaseSettings';

let settingsLoaded: Promise<void> | null = null;

function ensureSettingsLoaded(): Promise<void> {
  settingsLoaded ??= refreshSettingsCaches().then(() => undefined);
  return settingsLoaded;
}

export interface ModeratorSession {
  context: ResolverContext;
  moderator: DbUser;
}

export async function getModeratorSession(req: NextRequest): Promise<ModeratorSession | NextResponse> {
  let context: ResolverContext;
  try {
    await ensureSettingsLoaded();
    context = await getContextFromReqAndRes({ req });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SimpleMod session setup failed:', error);
    settingsLoaded = null;
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Session setup failed: ${message}` }, { status: 500 });
  }
  const moderator = context.currentUser;
  if (!moderator) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  if (!userIsAdminOrMod(moderator)) {
    return NextResponse.json({ error: 'Not a moderator' }, { status: 403 });
  }
  return { context, moderator };
}

export function isErrorResponse(session: ModeratorSession | NextResponse): session is NextResponse {
  return session instanceof NextResponse;
}
