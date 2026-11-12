import { looksLikeBotChallengePage } from '../server/resolvers/linkPreviewResolver';

describe('looksLikeBotChallengePage', () => {
  it('detects a reCAPTCHA interstitial by its title', () => {
    expect(looksLikeBotChallengePage(
      '<html><head><title>Checking your browser - reCAPTCHA</title></head><body><div class="g-recaptcha"></div></body></html>'
    )).toBe(true);
  });

  it('detects a Cloudflare challenge page', () => {
    expect(looksLikeBotChallengePage(
      '<html><head><title>Just a moment...</title></head><body><script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script></body></html>'
    )).toBe(true);
  });

  it('detects a proof-of-work challenge page whose title is just the hostname', () => {
    expect(looksLikeBotChallengePage(`<!doctype html>
      <html><head><title>pubmed.ncbi.nlm.nih.gov</title></head>
      <body>
        <div id="cookie-required" hidden><h1>Cookies must be enabled</h1></div>
        <script>const challengeId = "abc"; const challengeDomain = "pubmed.ncbi.nlm.nih.gov";</script>
      </body></html>`
    )).toBe(true);
  });

  it('does not flag ordinary pages', () => {
    expect(looksLikeBotChallengePage(
      '<html><head><title>Some article</title><meta name="description" content="An article about things."></head><body><p>Hello</p></body></html>'
    )).toBe(false);
  });

  it('does not flag pages with metadata that mention or embed CAPTCHAs', () => {
    expect(looksLikeBotChallengePage(
      '<html><head><title>CAPTCHA - Wikipedia</title><meta property="og:title" content="CAPTCHA - Wikipedia"></head><body><p>A CAPTCHA is a test.</p></body></html>'
    )).toBe(false);
    expect(looksLikeBotChallengePage(
      '<html><head><title>Contact us</title><meta property="og:description" content="Get in touch with our team."></head><body><form><div class="g-recaptcha"></div></form></body></html>'
    )).toBe(false);
  });
});
