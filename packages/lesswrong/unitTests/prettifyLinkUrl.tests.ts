import { prettifyLinkUrl } from '@/lib/utils/prettifyLinkUrl';

describe('prettifyLinkUrl', () => {
  it('collapses the id segment of a LessWrong post URL', () => {
    expect(prettifyLinkUrl('https://www.lesswrong.com/posts/tjeoLz2GzfFMysZhg/lightcone-commons'))
      .toBe('lesswrong.com/posts/.../lightcone-commons');
  });

  it('never collapses a readable multi-word slug', () => {
    expect(prettifyLinkUrl('https://example.com/some-long-post-title-here'))
      .toBe('example.com/some-long-post-title-here');
    expect(prettifyLinkUrl('https://example.com/a_long_underscored_slug'))
      .toBe('example.com/a_long_underscored_slug');
  });

  it('never collapses an ordinary long word', () => {
    expect(prettifyLinkUrl('https://example.com/documentation'))
      .toBe('example.com/documentation');
  });

  it('strips the protocol and a leading www.', () => {
    expect(prettifyLinkUrl('http://www.example.com/about')).toBe('example.com/about');
  });

  it('preserves meaningful subdomains', () => {
    expect(prettifyLinkUrl('https://blog.example.com/about')).toBe('blog.example.com/about');
    expect(prettifyLinkUrl('https://docs.example.com/about')).toBe('docs.example.com/about');
    expect(prettifyLinkUrl('https://mail.example.com/about')).toBe('mail.example.com/about');
  });

  it('strips mobile subdomains, including locale-mobile forms', () => {
    expect(prettifyLinkUrl('https://m.example.com/about')).toBe('example.com/about');
    expect(prettifyLinkUrl('https://mobile.example.com/about')).toBe('example.com/about');
    expect(prettifyLinkUrl('https://www2.example.com/about')).toBe('example.com/about');
    expect(prettifyLinkUrl('https://en.m.wikipedia.org/wiki/Bayes_theorem'))
      .toBe('wikipedia.org/wiki/Bayes_theorem');
    expect(prettifyLinkUrl('https://de.m.wikipedia.org/wiki/Bayes')).toBe('wikipedia.org/wiki/Bayes');
  });

  it('collapses a UUID path segment', () => {
    expect(prettifyLinkUrl('https://example.com/docs/123e4567-e89b-12d3-a456-426614174000/edit'))
      .toBe('example.com/docs/.../edit');
  });

  it('collapses a long pure-hex path segment', () => {
    expect(prettifyLinkUrl('https://example.com/c/deadbeefcafe1234'))
      .toBe('example.com/c/...');
  });

  it('handles a bare domain with no path', () => {
    expect(prettifyLinkUrl('https://example.com')).toBe('example.com');
  });

  it('drops a trailing slash', () => {
    expect(prettifyLinkUrl('https://example.com/')).toBe('example.com');
    expect(prettifyLinkUrl('https://example.com/about/')).toBe('example.com/about');
  });

  it('drops the query string and hash', () => {
    expect(prettifyLinkUrl('https://example.com/about?utm_source=twitter&x=1#section-2'))
      .toBe('example.com/about');
  });

  it('handles protocol-relative and scheme-less inputs', () => {
    expect(prettifyLinkUrl('//example.com/x')).toBe('example.com/x');
    expect(prettifyLinkUrl('example.com/x')).toBe('example.com/x');
    expect(prettifyLinkUrl('www.example.com/x')).toBe('example.com/x');
  });

  it('returns unparseable input trimmed and otherwise unchanged', () => {
    expect(prettifyLinkUrl('  not a url at all  ')).toBe('not a url at all');
    expect(prettifyLinkUrl('')).toBe('');
  });

  it('returns mailto: and other non-http schemes unchanged', () => {
    expect(prettifyLinkUrl('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(prettifyLinkUrl(' ftp://example.com/file.txt ')).toBe('ftp://example.com/file.txt');
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(prettifyLinkUrl('  https://www.example.com/about  ')).toBe('example.com/about');
  });
});
