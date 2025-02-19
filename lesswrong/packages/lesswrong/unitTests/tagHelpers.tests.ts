import { stableSortTags } from '../lib/collections/tags/helpers.ts';

describe('stableSortTags', () => {
  it('sorts tags by core-ness, score, and name', () => {
    const tags = [
      { tag: { name: 'Zebra', core: false }, tagRel: { baseScore: 10 } },
      { tag: { name: 'Apple', core: true }, tagRel: { baseScore: 5 } },
      { tag: { name: 'Banana', core: true }, tagRel: { baseScore: 20 } },
      { tag: { name: 'Orange', core: false }, tagRel: { baseScore: 15 } },
    ];

    const sortedTags = stableSortTags(tags);

    expect(sortedTags).toEqual([
      { tag: { name: 'Banana', core: true }, tagRel: { baseScore: 20 } },
      { tag: { name: 'Apple', core: true }, tagRel: { baseScore: 5 } },
      { tag: { name: 'Orange', core: false }, tagRel: { baseScore: 15 } },
      { tag: { name: 'Zebra', core: false }, tagRel: { baseScore: 10 } },
    ]);
  });

  it('sorts tags with the same score by name', () => {
    const tags = [
      { tag: { name: 'Banana', core: false }, tagRel: { baseScore: 10 } },
      { tag: { name: 'Apple', core: false }, tagRel: { baseScore: 10 } },
    ];

    const sortedTags = stableSortTags(tags);

    expect(sortedTags).toEqual([
      { tag: { name: 'Apple', core: false }, tagRel: { baseScore: 10 } },
      { tag: { name: 'Banana', core: false }, tagRel: { baseScore: 10 } },
    ]);
  });

  it('sorts tags without scores by core-ness only', () => {
    const tags = [
      { tag: { name: 'Banana', core: false }, tagRel: null },
      { tag: { name: 'Apple', core: false }, tagRel: null },
      { tag: { name: 'Banana', core: true }, tagRel: null },
      { tag: { name: 'Apple', core: true }, tagRel: null },
    ];

    const sortedTags = stableSortTags(tags);

    expect(sortedTags).toEqual([
      { tag: { name: 'Banana', core: true }, tagRel: null },
      { tag: { name: 'Apple', core: true }, tagRel: null },
      { tag: { name: 'Banana', core: false }, tagRel: null },
      { tag: { name: 'Apple', core: false }, tagRel: null },
    ]);
  });
});
