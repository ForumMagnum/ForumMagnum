import { optionalUrlRegex } from '../lib/utils/schemaUtils';

describe('optionalUrlRegex', () => {
  it('accepts the empty string', () => {
    expect(optionalUrlRegex.test('')).toBe(true);
  });

  it('accepts typical URLs', () => {
    const urls = [
      'http://example.com',
      'https://www.example.com/path?q=1#frag',
      'https://sub.domain.example.co.uk:8080/a/b',
      'ftp://ftp.example.org',
      'HTTPS://EXAMPLE.COM',
      'https://bücher.de',
      'https://a-b.example.com',
      'https://medium.com/@username',
      'https://www.meetup.com/foo-bar/events/12345/',
      'http://user:pass@example.com',
      'http://user@example.com:80/',
      'http://a@b@example.com',
      'http://8.8.8.8:8080/x',
    ];
    for (const url of urls) {
      expect(optionalUrlRegex.test(url)).toBe(true);
    }
  });

  it('rejects invalid URLs', () => {
    const urls = [
      ' ',
      'example.com',
      'www.example.com',
      'mailto:foo@example.com',
      'javascript:alert(1)',
      'http:/example.com',
      'http://localhost',
      'http://example.c',
      'http://-ab.com',
      'http://ab-.com',
      'http://a--b.com',
      'http://a_b.com',
      'http://example.com:1',
      'http://exa mple.com',
      'http://example.com/ foo',
      ' http://example.com',
      'http://example.com\n',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://192.168.1.1',
      'http://172.16.0.1',
      'http://224.0.0.1',
    ];
    for (const url of urls) {
      expect(optionalUrlRegex.test(url)).toBe(false);
    }
  });

  it('runs in linear time on inputs that cause catastrophic backtracking', () => {
    const n = 100000;
    const adversarialInputs = [
      'http://' + 'a'.repeat(n) + '!',
      'http://' + 'a-'.repeat(n / 2) + '!',
      'http://a.' + 'a'.repeat(n) + '!',
      'http://' + ':'.repeat(n),
      'http://' + 'a.co/@'.repeat(n / 6) + ' ',
      'http://' + 'a.co@'.repeat(n / 5) + '!',
    ];
    const start = Date.now();
    for (const input of adversarialInputs) {
      expect(optionalUrlRegex.test(input)).toBe(false);
    }
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
