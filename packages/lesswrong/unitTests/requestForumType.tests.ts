import { getForumTypeForPage } from '@/server/utils/pageUtil';
import { NextRequest } from 'next/server';
import * as nextHeaders from 'next/headers';
import { RequestCookiesAdapter } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getForumTypeForRequest } from '@/server/utils/requestUtil';

jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn() }));

interface ForumRequestCase {
  description: string;
  requestHeaders: Record<string, string>;
  expected: 'LessWrong' | 'AlignmentForum';
}

const cases: ForumRequestCase[] = [
  { description: 'missing headers', requestHeaders: {}, expected: 'LessWrong' },
  { description: 'LW host', requestHeaders: { host: 'www.lesswrong.com' }, expected: 'LessWrong' },
  ...['alignmentforum.org', 'www.alignmentforum.org', 'alignmentforum.localhost'].flatMap((domain): ForumRequestCase[] => [
    { description: `host ${domain}`, requestHeaders: { host: domain }, expected: 'AlignmentForum' },
    { description: `forwarded host ${domain}`, requestHeaders: { host: 'deployment.example', 'x-forwarded-host': domain }, expected: 'AlignmentForum' },
  ]),
  { description: 'local port', requestHeaders: { host: 'alignmentforum.localhost:3000' }, expected: 'AlignmentForum' },
  { description: 'case-insensitive host', requestHeaders: { host: 'WWW.AlignmentForum.ORG:443' }, expected: 'AlignmentForum' },
  { description: 'AF host with LW forwarded host', requestHeaders: { host: 'alignmentforum.org', 'x-forwarded-host': 'www.lesswrong.com' }, expected: 'AlignmentForum' },
  { description: 'cookie override', requestHeaders: { host: 'localhost:3000', cookie: 'forumType=AlignmentForum' }, expected: 'AlignmentForum' },
  { description: 'other cookie value', requestHeaders: { cookie: 'forumType=LessWrong' }, expected: 'LessWrong' },
  { description: 'invalid cookie value', requestHeaders: { cookie: 'forumType=true' }, expected: 'LessWrong' },
  { description: 'empty cookie', requestHeaders: { cookie: 'forumType=' }, expected: 'LessWrong' },
  { description: 'cookie cannot override AF host to LW', requestHeaders: { host: 'alignmentforum.org', cookie: 'forumType=LessWrong' }, expected: 'AlignmentForum' },
  { description: 'domain suffix lookalike', requestHeaders: { host: 'alignmentforum.org.example.com' }, expected: 'LessWrong' },
  { description: 'domain prefix lookalike', requestHeaders: { host: 'fakealignmentforum.org' }, expected: 'LessWrong' },
  { description: 'unlisted subdomain', requestHeaders: { host: 'staging.alignmentforum.org' }, expected: 'LessWrong' },
];

describe('request forum selection', () => {
  beforeEach(() => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Request forum selection must not use the deployment setting');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it.each(cases)('uses $description consistently for requests and pages', async ({ requestHeaders, expected }) => {
    const request = new NextRequest('https://deployment.example/', { headers: requestHeaders });
    jest.spyOn(nextHeaders, 'headers').mockResolvedValue(request.headers);
    jest.spyOn(nextHeaders, 'cookies').mockResolvedValue(RequestCookiesAdapter.seal(request.cookies));

    expect(getForumTypeForRequest(request)).toBe(expected);
    expect(await getForumTypeForPage()).toBe(expected);
  });
});
