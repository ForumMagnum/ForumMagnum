/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentItemBodyContext } from '../components/contents/ContentItemBodyContext';
import { useFootnoteHTML } from '../components/linkPreview/useFootnoteHTML';
import { truncatise } from '../lib/truncatise';

const noAncestors: string[] = [];
const fullHTML = '<ol class="footnotes"><li id="fn1"><p>First note.</p></li><li id="fn2"><p>Second note has more text.</p></li></ol>';

function FootnoteResult({href, ancestors}: {href: string, ancestors: string[]}) {
  const html = useFootnoteHTML(href, ancestors);
  return <output data-testid="preview">{html ?? 'unavailable'}</output>;
}

function FootnoteTest({html, href='#fn2', ancestors=noAncestors}: {
  html: string,
  href?: string,
  ancestors?: string[],
}) {
  return <ContentItemBodyContext.Provider value={html}>
    <div dangerouslySetInnerHTML={{__html: html}} />
    <FootnoteResult href={href} ancestors={ancestors} />
  </ContentItemBodyContext.Provider>;
}

function truncateInsideSecondNote() {
  return truncatise(fullHTML, {TruncateBy: 'characters', TruncateLength: 18});
}

describe('footnote previews of truncated content', () => {
  it('omits a footnote cut off in the middle of its text', () => {
    render(<FootnoteTest html={truncateInsideSecondNote()} />);
    expect(document.getElementById('fn2')?.textContent).toContain('Second');
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });

  it('keeps complete footnotes before the cutoff', () => {
    render(<FootnoteTest html={truncateInsideSecondNote()} href="#fn1" />);
    expect(screen.getByTestId('preview').textContent).toBe('<p>First note.</p>');
  });

  it('omits truncated content inside a wrapper carrying the footnote ID', () => {
    render(<FootnoteTest html={'<div id="fn2"><p data-truncated="true">Partial note</p></div>'} />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });

  it('loads the full footnote on expansion and removes it on collapse', () => {
    const truncated = truncateInsideSecondNote();
    const {rerender} = render(<FootnoteTest html={truncated} />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
    rerender(<FootnoteTest html={fullHTML} />);
    expect(screen.getByTestId('preview').textContent).toBe('<p>Second note has more text.</p>');
    rerender(<FootnoteTest html={truncated} />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });

  it('refreshes a footnote after an edit', () => {
    const {rerender} = render(<FootnoteTest html={fullHTML} />);
    rerender(<FootnoteTest html={fullHTML.replace('Second note', 'Updated note')} />);
    expect(screen.getByTestId('preview').textContent).toBe('<p>Updated note has more text.</p>');
  });

  it('omits a footnote cut off inside a table', () => {
    const html = '<ol><li id="fn2"><p>Introduction.</p><table><tbody><tr><td>First cell</td><td>Second cell</td></tr></tbody></table></li></ol>';
    render(<FootnoteTest html={truncatise(html, {TruncateBy: 'characters', TruncateLength: 18})} />);
    expect(document.getElementById('fn2')?.querySelector('table')).not.toBeNull();
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });

  it('does not mistake a complete final footnote for a truncated one', () => {
    render(<FootnoteTest html={truncatise(fullHTML, {TruncateBy: 'characters', TruncateLength: 100})} />);
    expect(screen.getByTestId('preview').textContent).toBe('<p>Second note has more text.</p>');
  });

  it('does not recursively preview an ancestor footnote', () => {
    render(<FootnoteTest html={fullHTML} ancestors={['#fn2']} />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });

  it('handles missing footnotes and invalid selectors', () => {
    const {rerender} = render(<FootnoteTest html={fullHTML} href="#fn3" />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
    rerender(<FootnoteTest html={fullHTML} href="#fn:1" />);
    expect(screen.getByTestId('preview').textContent).toBe('unavailable');
  });
});
