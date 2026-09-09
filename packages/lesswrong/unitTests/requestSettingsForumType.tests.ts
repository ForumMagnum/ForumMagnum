import { NextRequest } from 'next/server';
import { fmCrosspostBaseUrlSetting, siteUrlSetting } from '@/lib/instanceSettings';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { crosspostOptionsHandler, setCorsHeaders } from '@/server/crossposting/cors';
import { getSiteUrlFromHeaders, getSiteUrlFromReq } from '@/server/utils/getSiteUrl';

describe('forum settings in request responses', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses each response forum for the crossposting origin', () => {
    jest.spyOn(fmCrosspostBaseUrlSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'https://af-crosspost.example/' : 'https://lw-crosspost.example/'
    );

    const lwResponse = new Response();
    const afResponse = new Response();
    setCorsHeaders(lwResponse, 'LessWrong');
    setCorsHeaders(afResponse, 'AlignmentForum');

    expect(lwResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://lw-crosspost.example');
    expect(afResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://af-crosspost.example');
    expect(afResponse.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });

  it('uses the request forum for preflight responses', () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');
    jest.spyOn(fmCrosspostBaseUrlSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'https://af-crosspost.example/' : null
    );

    const response = crosspostOptionsHandler(new NextRequest('https://www.alignmentforum.org/api/v2/crosspost/crosspost'));

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://af-crosspost.example');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });

  it('uses the supplied forum for site URL fallbacks', () => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'https://www.alignmentforum.org/' : 'https://www.lesswrong.com/'
    );
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');

    expect(getSiteUrlFromHeaders(undefined, 'LessWrong')).toBe('https://www.lesswrong.com');
    expect(getSiteUrlFromHeaders(undefined, 'AlignmentForum')).toBe('https://www.alignmentforum.org');
    expect(getSiteUrlFromReq(new NextRequest('https://deployment.example/'))).toBe('https://www.alignmentforum.org');
  });

  it('preserves forwarded URL handling without reading the site URL setting', () => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(() => {
      throw new Error('Forwarded requests should not need a configured URL');
    });
    const headers = new Headers({
      'x-forwarded-for': '127.0.0.1',
      'x-forwarded-host': 'localhost:3456',
      'x-forwarded-port': '3456',
      'x-forwarded-proto': 'http',
    });

    expect(getSiteUrlFromHeaders(headers, 'AlignmentForum')).toBe('http://localhost:3456');
    headers.set('x-forwarded-for', '203.0.113.1');
    headers.set('x-forwarded-host', 'www.alignmentforum.org');
    headers.set('x-forwarded-proto', 'https');
    expect(getSiteUrlFromHeaders(headers, 'AlignmentForum')).toBe('https://www.alignmentforum.org');
  });
});
