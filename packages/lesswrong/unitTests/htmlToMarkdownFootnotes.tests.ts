import { htmlToMarkdown, markdownToHtml } from "@/server/editor/conversionUtils";
import { JSDOM } from "jsdom";

function footnoteHtml(id: string, content: string): string {
  return `<li class="footnote-item" data-footnote-id="${id}">`
    + `<span class="footnote-back-link"><sup><strong><a href="#fnref${id}">^</a></strong></sup></span>`
    + `<div class="footnote-content">${content}</div></li>`;
}

function referenceHtml(id: string): string {
  return `<span class="footnote-reference" data-footnote-id="${id}"><sup><a href="#fn${id}">[1]</a></sup></span>`;
}

describe("htmlToMarkdown footnotes", () => {
  it.each([true, false])("preserves table cells inside a footnote (with introductory paragraph: %s)", (withIntro) => {
    const table = '<table><thead><tr><th>Eigenism</th><th>Recognition schema</th></tr></thead>'
      + '<tbody><tr><td>eigenself</td><td>self-description</td></tr>'
      + '<tr><td>community pattern</td><td>a second self-description</td></tr></tbody></table>';
    const content = (withIntro ? '<p>A comparison:</p>' : '') + table + '<p>After the table.</p>';
    const html = `<p>See the note${referenceHtml('comparison')}.</p>`
      + `<ol class="footnote-section">${footnoteHtml('comparison', content)}</ol>`;
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('| Eigenism | Recognition schema |');
    expect(markdown).toContain('\n    | eigenself | self-description |');
    expect(markdown).not.toContain('fnref');

    const document = new JSDOM(markdownToHtml(markdown)).window.document;
    const note = document.querySelector('.footnote-item');
    expect(Array.from(note?.querySelectorAll('th, td') ?? [], cell => cell.textContent)).toEqual([
      'Eigenism', 'Recognition schema', 'eigenself', 'self-description',
      'community pattern', 'a second self-description',
    ]);
    expect(note?.textContent).toContain('After the table.');
    expect(document.querySelectorAll('table')).toHaveLength(1);
  });

  it("keeps paragraphs, inline formatting, and lists within separate footnotes", () => {
    const html = `<p>Notes${referenceHtml('first')}${referenceHtml('second')}.</p>`
      + '<ol class="footnote-section">'
      + footnoteHtml('first', '<p>First <strong>paragraph</strong>.</p><p>Next <a href="https://example.com/">link</a>.</p>'
        + '<ul><li>One</li><li>Two</li></ul>')
      + footnoteHtml('second', 'Plain text.')
      + '</ol>';
    const markdown = htmlToMarkdown(html);
    const document = new JSDOM(markdownToHtml(markdown)).window.document;
    const notes = document.querySelectorAll('.footnote-item');

    expect(markdown).toContain('[^second]: Plain text.');
    expect(markdown).not.toContain('fnref');
    expect(notes).toHaveLength(2);
    expect(notes[0].querySelector('strong')?.textContent).toBe('paragraph');
    expect(notes[0].querySelectorAll('p')).toHaveLength(2);
    expect(notes[0].querySelector('a')?.getAttribute('href')).toBe('https://example.com/');
    expect(Array.from(notes[0].querySelectorAll('li'), item => item.textContent)).toEqual(['One', 'Two']);
    expect(notes[1].textContent).toContain('Plain text.');
    expect(htmlToMarkdown(document.body.innerHTML)).not.toContain('fnref');
  });

  it("shows suggested insertions and deletions inside a footnote", () => {
    const html = `<p>Body <del>old</del><ins>new</ins> text${referenceHtml('suggested')}.</p>`
      + '<ol class="footnote-section">'
      + footnoteHtml('suggested', '<p>Because <del>recognition</del><ins>identification</ins> is hard.</p>'
        + '<p><ins>An added sentence.</ins></p>')
      + '</ol>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('Body <del>old</del><ins>new</ins> text');
    expect(markdown).toContain('[^suggested]: Because <del>recognition</del><ins>identification</ins> is hard.');
    expect(markdown).toContain('<ins>An added sentence.</ins>');
    expect(markdown).not.toContain('recognitionidentification');
  });
});
