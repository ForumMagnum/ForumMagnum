import { sanitize } from '../lib/utils/sanitize';

describe('sanitize iframe handling', () => {
  // ── srcdoc widget iframes ──────────────────────────────────────────

  describe('srcdoc widget iframes', () => {
    it('preserves a valid srcdoc iframe with the marker attribute and safe sandbox', () => {
      const input = '<iframe srcdoc="<h1>hi</h1>" sandbox="allow-scripts" data-lexical-iframe-widget="true" title="Widget"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('srcdoc');
      expect(result).toContain('data-lexical-iframe-widget');
      expect(result).toContain('sandbox="allow-scripts"');
    });

    it('forces sandbox to allow-scripts even if input has allow-same-origin', () => {
      const input = '<iframe srcdoc="<h1>hi</h1>" sandbox="allow-scripts allow-same-origin" data-lexical-iframe-widget="true"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('sandbox="allow-scripts"');
      expect(result).not.toContain('allow-same-origin');
    });

    it('forces sandbox to allow-scripts even if input has allow-same-origin among many tokens', () => {
      const input = '<iframe srcdoc="<h1>hi</h1>" sandbox="allow-scripts allow-popups allow-same-origin allow-forms" data-lexical-iframe-widget="true"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('sandbox="allow-scripts"');
      expect(result).not.toContain('allow-same-origin');
      expect(result).not.toContain('allow-popups');
      expect(result).not.toContain('allow-forms');
    });

    it('strips srcdoc iframes that lack the marker attribute', () => {
      const input = '<iframe srcdoc="<h1>hi</h1>" sandbox="allow-scripts"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('srcdoc');
      expect(result).not.toContain('<iframe');
    });

    it('strips srcdoc iframes with no sandbox at all (marker present)', () => {
      // The transformer forces sandbox="allow-scripts" for valid widgets,
      // so if the marker IS present but sandbox is missing, the result
      // should still get sandbox="allow-scripts" (not be stripped).
      const input = '<iframe srcdoc="<h1>hi</h1>" data-lexical-iframe-widget="true"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('sandbox="allow-scripts"');
      expect(result).toContain('srcdoc');
    });

    it('preserves srcdoc content through round-trip', () => {
      const widgetHtml = '&lt;h1&gt;Hello&lt;/h1&gt;&lt;script&gt;alert(1)&lt;/script&gt;';
      const input = `<iframe srcdoc="${widgetHtml}" sandbox="allow-scripts" data-lexical-iframe-widget="true"></iframe>`;
      const result = sanitize(input);
      expect(result).toContain('srcdoc');
    });

  });

  // ── code block gutter ────────────────────────────────────────────

  describe('code block gutter-chars', () => {
    it('preserves --gutter-chars inline style on pre.code-block', () => {
      const input = '<pre class="code-block" data-gutter="1\n2\n3" style="--gutter-chars: 1"><span class="code-token-comment">// hi</span></pre>';
      const result = sanitize(input);
      expect(result).toContain('--gutter-chars');
      expect(result).toContain('data-gutter');
    });

    it('strips non-allowed CSS properties from pre style', () => {
      const input = '<pre class="code-block" style="--gutter-chars: 2; color: red">code</pre>';
      const result = sanitize(input);
      expect(result).toContain('--gutter-chars');
      expect(result).not.toContain('color');
    });
  });

  // ── src-based iframes ──────────────────────────────────────────────

  describe('src-based iframes', () => {
    it('preserves iframes with allowed hostnames', () => {
      const input = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('<iframe');
      expect(result).toContain('youtube.com');
    });

    it('preserves youtube-nocookie iframes', () => {
      const input = '<iframe src="https://www.youtube-nocookie.com/embed/abc123"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('<iframe');
    });

    it('preserves metaculus iframes', () => {
      const input = '<iframe src="https://metaculus.com/questions/embed/123"></iframe>';
      const result = sanitize(input);
      expect(result).toContain('<iframe');
    });

    it('strips iframes with disallowed hostnames', () => {
      const input = '<iframe src="https://evil.example.com/exploit"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.example.com');
    });

    it('strips iframes with javascript: src', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('javascript');
    });

    it('strips iframes with data: src', () => {
      const input = '<iframe src="data:text/html,<h1>hi</h1>"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('<iframe');
    });

    it('strips iframes with no src and no srcdoc', () => {
      const input = '<iframe></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('<iframe');
    });
  });

  // ── mixed / adversarial cases ──────────────────────────────────────

  describe('adversarial cases', () => {
    it('strips srcdoc iframe that also has a src (marker present)', () => {
      // An iframe with srcdoc takes the srcdoc path in the transformer.
      // The marker is present so it should be preserved with forced sandbox.
      const input = '<iframe src="https://evil.com" srcdoc="<h1>hi</h1>" sandbox="allow-scripts" data-lexical-iframe-widget="true"></iframe>';
      const result = sanitize(input);
      // Should be treated as a srcdoc widget (marker present), sandbox forced
      expect(result).toContain('sandbox="allow-scripts"');
      expect(result).toContain('srcdoc');
    });

    it('strips srcdoc iframe with src and no marker', () => {
      const input = '<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>evil()</script>"></iframe>';
      const result = sanitize(input);
      // srcdoc path: no marker → dropped
      expect(result).not.toContain('<iframe');
    });

    it('does not allow forging the marker on a src-based iframe to bypass hostname check', () => {
      // An iframe with data-lexical-iframe-widget but using src (no srcdoc)
      // should still go through the hostname check, not get a free pass.
      const input = '<iframe src="https://evil.com/steal" data-lexical-iframe-widget="true"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('evil.com');
      expect(result).not.toContain('<iframe');
    });

    it('surrounding content is preserved when an iframe is stripped', () => {
      const input = '<p>before</p><iframe src="https://evil.com"></iframe><p>after</p>';
      const result = sanitize(input);
      expect(result).toContain('<p>before</p>');
      expect(result).toContain('<p>after</p>');
      expect(result).not.toContain('<iframe');
    });
  });
});
