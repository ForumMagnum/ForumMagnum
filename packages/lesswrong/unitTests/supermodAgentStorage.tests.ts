import { parse, Kind } from 'graphql';
import { supermodAgentStorageEnabledSetting } from '@/lib/instanceSettings';
import userSchema from '@/lib/collections/users/newSchema';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { getLoreTool, getModerationSummariesTool } from '@/server/moderation/agentTools/readTools';
import SelectFragmentQuery from '@/server/sql/SelectFragmentQuery';
import { createSqlFragmentFromAst } from '@/server/sql/SqlFragment';

jest.mock('@/server/sqlConnection', () => ({
  ...jest.requireActual<typeof import('@/server/sqlConnection')>('@/server/sqlConnection'),
  createSqlConnection: jest.fn(() => {
    throw new Error('Unit tests must not access the database');
  }),
}));

describe('Supermod with agent storage disabled', () => {
  beforeEach(() => {
    jest.spyOn(supermodAgentStorageEnabledSetting, 'get').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports unavailable storage without querying missing tables', async () => {
    const context = createAdminContext({ forumType: 'LessWrong' });
    for (const [tool, args] of [
      [getLoreTool, { targetUserId: 'test-user' }],
      [getModerationSummariesTool, { userId: 'test-user' }],
      [getModerationSummariesTool, {}],
    ] as const) {
      const result = JSON.parse(await tool.execute(args, context, {}));
      expect(result.unavailable).toContain('Agent storage is not enabled');
    }
  });

  it('still requires moderator access when storage is unavailable', async () => {
    const context = createAnonymousContext({ forumType: 'LessWrong' });
    for (const tool of [getLoreTool, getModerationSummariesTool]) {
      await expect(tool.execute({}, context, {})).rejects.toThrow('Moderator access required');
    }
  });

  it('does not select the missing notes column in user queries', () => {
    const doc = parse('fragment AgentNotesCompatibility on User { _id llmNotes }');
    const fragments = doc.definitions.filter(def => def.kind === Kind.FRAGMENT_DEFINITION);
    const fragment = createSqlFragmentFromAst('AgentNotesCompatibility', fragments);
    const { sql } = new SelectFragmentQuery(fragment, null).compile();
    expect(sql).not.toContain('"llmNotes"');
  });

  it('returns null for unavailable notes and preserves notes when enabled', async () => {
    const context = createAdminContext({ forumType: 'LessWrong' });
    const user = context.currentUser;
    if (!user) throw new Error('Expected test admin');
    user.llmNotes = 'Existing agent note';
    expect(await userSchema.llmNotes.graphql.resolver(user, {}, context)).toBeNull();
    jest.spyOn(supermodAgentStorageEnabledSetting, 'get').mockReturnValue(true);
    expect(await userSchema.llmNotes.graphql.resolver(user, {}, context)).toBe('Existing agent note');
  });
});
