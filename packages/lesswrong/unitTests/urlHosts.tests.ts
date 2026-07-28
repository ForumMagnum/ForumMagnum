import { getNormalizedHost, normalizeDisplayHost } from '@/lib/utils/urlHosts';

describe('normalizeDisplayHost', () => {
  it('strips noise subdomains', () => {
    expect(normalizeDisplayHost('www.example.com')).toBe('example.com');
    expect(normalizeDisplayHost('m.example.com')).toBe('example.com');
    expect(normalizeDisplayHost('mobile.example.com')).toBe('example.com');
    expect(normalizeDisplayHost('en.m.wikipedia.org')).toBe('wikipedia.org');
  });

  it('preserves meaningful subdomains', () => {
    expect(normalizeDisplayHost('blog.example.com')).toBe('blog.example.com');
    expect(normalizeDisplayHost('mail.example.com')).toBe('mail.example.com');
  });

  it('only strips a prefix that leaves a domain behind', () => {
    expect(normalizeDisplayHost('mobile.com')).toBe('mobile.com');
    expect(normalizeDisplayHost('www.com')).toBe('www.com');
  });

  it('does not strip a www that is not the first label', () => {
    expect(normalizeDisplayHost('foo.www.com')).toBe('foo.www.com');
  });

  it('lowercases, since hosts are case-insensitive', () => {
    expect(normalizeDisplayHost('WWW.Example.COM')).toBe('example.com');
  });
});

describe('getNormalizedHost', () => {
  it('normalizes the host of a URL', () => {
    expect(getNormalizedHost('https://www.example.com/a/b?c=d#e')).toBe('example.com');
  });

  it('returns null for missing or unparseable input', () => {
    expect(getNormalizedHost(null)).toBe(null);
    expect(getNormalizedHost(undefined)).toBe(null);
    expect(getNormalizedHost('')).toBe(null);
    expect(getNormalizedHost('not a url')).toBe(null);
  });
});
