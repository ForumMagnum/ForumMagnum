import {
  sameText,
  findHrefForPhrase,
  findTwinPreview,
  HoverPreviewEntry,
} from '@/components/editor/lexicalPlugins/links/hoverPreviewReuse';

function entry(fields: Partial<HoverPreviewEntry> & { nodeKey: string }): HoverPreviewEntry {
  return {
    text: '',
    previewHtml: '',
    href: '',
    ...fields,
  };
}

describe('sameText', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(sameText('  the Evaluators ', 'the evaluators')).toBe(true);
    expect(sameText('THE EVALUATORS', 'the evaluators')).toBe(true);
  });

  it('collapses internal whitespace runs, including newlines', () => {
    expect(sameText('split  the\nbill', 'split the bill')).toBe(true);
    expect(sameText('a\t\tb', 'a b')).toBe(true);
  });

  it('does not treat empty or blank strings as matching', () => {
    expect(sameText('', '')).toBe(false);
    expect(sameText('   ', '')).toBe(false);
    expect(sameText('', 'the evaluators')).toBe(false);
  });

  it('keeps distinct phrases distinct', () => {
    expect(sameText('evaluator', 'evaluators')).toBe(false);
    expect(sameText('the evaluators', 'the evaluator')).toBe(false);
  });
});

describe('findTwinPreview', () => {
  it('copies a preview written for the same phrase', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the Evaluators', previewHtml: '<p>Who they are</p>', href: 'https://a.example' }),
      entry({ nodeKey: '2', text: 'the evaluators' }),
    ];
    expect(findTwinPreview(entries, '2', 'the evaluators', '')?.nodeKey).toBe('1');
  });

  it('copies a preview sharing the same link when the phrase differs', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the panel', previewHtml: '<p>Who they are</p>', href: 'https://a.example' }),
      entry({ nodeKey: '2', text: 'the evaluators', href: 'https://a.example' }),
    ];
    expect(findTwinPreview(entries, '2', 'the evaluators', 'https://a.example')?.nodeKey).toBe('1');
  });

  it('prefers a phrase match over a link match', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the panel', previewHtml: '<p>By link</p>', href: 'https://a.example' }),
      entry({ nodeKey: '2', text: 'the evaluators', previewHtml: '<p>By phrase</p>', href: 'https://b.example' }),
      entry({ nodeKey: '3', text: 'the evaluators', href: 'https://a.example' }),
    ];
    expect(findTwinPreview(entries, '3', 'the evaluators', 'https://a.example')?.previewHtml).toBe('<p>By phrase</p>');
  });

  it('never copies from the entry being annotated', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the evaluators', previewHtml: '<p>Its own</p>', href: 'https://a.example' }),
    ];
    expect(findTwinPreview(entries, '1', 'the evaluators', 'https://a.example')).toBe(undefined);
  });

  it('ignores a blank href rather than matching every unlinked entry', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'something else', previewHtml: '<p>Unrelated</p>' }),
      entry({ nodeKey: '2', text: 'the evaluators' }),
    ];
    expect(findTwinPreview(entries, '2', 'the evaluators', '')).toBe(undefined);
    expect(findTwinPreview(entries, '2', 'the evaluators', '   ')).toBe(undefined);
  });

  it('returns undefined when there is no twin', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the panel', previewHtml: '<p>Unrelated</p>', href: 'https://a.example' }),
    ];
    expect(findTwinPreview(entries, '2', 'the evaluators', 'https://b.example')).toBe(undefined);
    expect(findTwinPreview([], '2', 'the evaluators', 'https://b.example')).toBe(undefined);
  });

  it('skips entries whose previewHtml is empty', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the evaluators', href: 'https://a.example' }),
      entry({ nodeKey: '2', text: 'the evaluators', previewHtml: '<p>Real preview</p>', href: 'https://a.example' }),
      entry({ nodeKey: '3', text: 'the evaluators', href: 'https://a.example' }),
    ];
    expect(findTwinPreview(entries, '3', 'the evaluators', 'https://a.example')?.nodeKey).toBe('2');
  });
});

describe('findHrefForPhrase', () => {
  it('finds where the same phrase already points, regardless of casing', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'The Evaluators', href: 'https://a.example' }),
      entry({ nodeKey: '2', text: 'the evaluators' }),
    ];
    expect(findHrefForPhrase(entries, '2', 'the  evaluators')).toBe('https://a.example');
  });

  it('ignores entries with an empty href', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the evaluators' }),
      entry({ nodeKey: '2', text: 'the evaluators', href: 'https://b.example' }),
      entry({ nodeKey: '3', text: 'the evaluators' }),
    ];
    expect(findHrefForPhrase(entries, '3', 'the evaluators')).toBe('https://b.example');
  });

  it('never takes the href off the entry being annotated', () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the evaluators', href: 'https://a.example' }),
    ];
    expect(findHrefForPhrase(entries, '1', 'the evaluators')).toBe('');
  });

  it("returns '' when nothing matches", () => {
    const entries = [
      entry({ nodeKey: '1', text: 'the panel', href: 'https://a.example' }),
    ];
    expect(findHrefForPhrase(entries, '2', 'the evaluators')).toBe('');
    expect(findHrefForPhrase(entries, '2', '')).toBe('');
    expect(findHrefForPhrase([], '2', 'the evaluators')).toBe('');
  });
});
