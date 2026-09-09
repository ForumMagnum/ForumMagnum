import { forumHeaderTitleSetting, forumShortTitleSetting, tabTitleSetting } from '@/lib/instanceSettings';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getSettings } from '@/server/settings/settings';
import * as executionEnvironment from '@/lib/executionEnvironment';

// Exercise the actual deployment configs rather than Jest's test settings.
jest.mock('@/lib/executionEnvironment', () => ({
  isAnyTest: false,
  isDevelopment: false,
  isServer: true,
  get isProduction() { return false; },
}));

describe('public instance settings by forum on the server', () => {
  const originalEnvName = process.env.ENV_NAME;

  beforeEach(() => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Settings must use the supplied forum, not the deployment forum');
    });
  });

  afterEach(() => {
    if (originalEnvName === undefined) delete process.env.ENV_NAME;
    else process.env.ENV_NAME = originalEnvName;
    jest.restoreAllMocks();
  });

  it.each([
    ['localLwDevDb', 'development'],
    ['prodLw', 'development'],
    ['prodLw', 'production'],
    ['baserates', 'development'],
  ])('keeps LW and AF titles separate for %s in %s', (envName, nodeEnv) => {
    process.env.ENV_NAME = envName;
    jest.spyOn(executionEnvironment, 'isProduction', 'get').mockReturnValue(nodeEnv === 'production');

    expect(forumHeaderTitleSetting.get('LessWrong')).toBe('LESSWRONG');
    expect(forumHeaderTitleSetting.get('AlignmentForum')).toBe('AI ALIGNMENT FORUM');
    expect(forumShortTitleSetting.get('LessWrong')).toBe('LW');
    expect(forumShortTitleSetting.get('AlignmentForum')).toBe('AF');
    expect(tabTitleSetting.get('AlignmentForum')).toBe('AI Alignment Forum');
    expect(forumHeaderTitleSetting.get('LessWrong')).toBe('LESSWRONG');
    expect(getSettings('LessWrong').private).toBe(getSettings('AlignmentForum').private);
  });

  it('uses the requested forum when ENV_NAME is absent or invalid', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.ENV_NAME;
    expect(forumHeaderTitleSetting.get('AlignmentForum')).toBe('AI ALIGNMENT FORUM');
    process.env.ENV_NAME = 'invalid';
    expect(forumHeaderTitleSetting.get('LessWrong')).toBe('LESSWRONG');
    expect(forumHeaderTitleSetting.get('AlignmentForum')).toBe('AI ALIGNMENT FORUM');
  });
});
