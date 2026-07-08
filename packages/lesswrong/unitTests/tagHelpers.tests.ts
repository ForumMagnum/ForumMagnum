import { stableSortTags, tagUserHasSufficientKarma } from '../lib/collections/tags/helpers.ts';

describe('stableSortTags', () => {
  it('sorts tags by core-ness, score, and name', () => {
    const tags = [
      { tag: { name: 'Zebra', core: false }, tagRel: { baseScore: 10 } },
      { tag: { name: 'Apple', core: true }, tagRel: { baseScore: 5 } },
      { tag: { name: 'Banana', core: true }, tagRel: { baseScore: 20 } },
      { tag: { name: 'Orange', core: false }, tagRel: { baseScore: 15 } },
    ];

    const sortedTags = stableSortTags(tags, {coreTags: "first"});

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

    const sortedTags = stableSortTags(tags, {coreTags: "first"});

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

    const sortedTags = stableSortTags(tags, {coreTags: "first"});

    expect(sortedTags).toEqual([
      { tag: { name: 'Banana', core: true }, tagRel: null },
      { tag: { name: 'Apple', core: true }, tagRel: null },
      { tag: { name: 'Banana', core: false }, tagRel: null },
      { tag: { name: 'Apple', core: false }, tagRel: null },
    ]);
  });
});

describe('tagUserHasSufficientKarma', () => {
  it('rejects unreviewed zero-karma users', () => {
    const user = {
      isAdmin: false,
      karma: 0,
      reviewedByUserId: null,
    };

    expect(tagUserHasSufficientKarma(user, 'new')).toBe(false);
    expect(tagUserHasSufficientKarma(user, 'edit')).toBe(false);
  });

  it('allows reviewed users who meet the karma threshold', () => {
    const user = {
      isAdmin: false,
      karma: 1,
      reviewedByUserId: 'moderator',
    };

    expect(tagUserHasSufficientKarma(user, 'new')).toBe(true);
    expect(tagUserHasSufficientKarma(user, 'edit')).toBe(true);
  });

  it('allows admins regardless of review status or karma', () => {
    const user = {
      isAdmin: true,
      karma: 0,
      reviewedByUserId: null,
    };

    expect(tagUserHasSufficientKarma(user, 'new')).toBe(true);
    expect(tagUserHasSufficientKarma(user, 'edit')).toBe(true);
  });
});
