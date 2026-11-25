import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';

describe('getDraftMessageHtml', () => {
  it('inserts the display name as text, not markup', () => {
    const html = getDraftMessageHtml({
      html: '<p>Hi {{firstName}}, welcome {{displayName}}.</p>',
      displayName: '<b>Al</b> & "Bo"',
    });
    expect(html).toBe('<p>Hi &lt;b&gt;Al&lt;/b&gt;, welcome &lt;b&gt;Al&lt;/b&gt; &amp; &quot;Bo&quot;.</p>');
  });

  it('does not treat "$" sequences in the display name as replacement patterns', () => {
    const html = getDraftMessageHtml({ html: '<p>Hi {{displayName}}!</p>', displayName: "A$'B" });
    expect(html).toBe('<p>Hi A$&#39;B!</p>');
  });
});
