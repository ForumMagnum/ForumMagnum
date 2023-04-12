import { mergeSelectors } from "../lib/utils/viewUtils"
import { postStatuses } from '../lib/collections/posts/constants';

describe("mergeSelectors", () => {
  it("Regression test: correctly merges selectors to display user posts with community hidden", () => {
    const baseSelector = {
      $and: [
        {
          $or: [
            { "tagRelevance.ZCihBFp5P64JCvQY6": { $lt: 1 } },
            { "tagRelevance.ZCihBFp5P64JCvQY6": { $exists: false } },
          ],
        },
      ],
      $or: undefined,
      status: postStatuses.STATUS_APPROVED,
      draft: false,
    };
    const newSelector = {
      userId: { allowAny: true },
      groupId: null,
      $or: [{ userId: "abcd" }, { "coauthorStatuses.userId": "abcd" }],
    };
    
    const mergedSelector = mergeSelectors(baseSelector, newSelector)
    expect(mergedSelector).toEqual({
      '$and': [
        { '$or': [
          { userId: 'abcd' },
          { 'coauthorStatuses.userId': 'abcd' }
        ] },
        {
          '$or': [
            { 'tagRelevance.ZCihBFp5P64JCvQY6': { '$lt': 1 } },
            { 'tagRelevance.ZCihBFp5P64JCvQY6': { '$exists': false } }
          ]
        }
      ],
      status: postStatuses.STATUS_APPROVED,
      draft: false,
      groupId: null,
      userId: { allowAny: true },
    })
  })

  it("merges two simple $or selectors together", () => {
    const baseSelector = {
      $or: [ { a: 1 }, { b: 2 } ]
    }
    const newSelector = {
      $or: [ { c: 3 }, { d: 4 } ]
    }
    const mergedSelector = mergeSelectors(baseSelector, newSelector)
    expect(mergedSelector).toEqual({
      $and: [ { $or: [ { a: 1 }, { b: 2 } ] }, { $or: [ { c: 3 }, { d: 4 } ] } ]
    })
  })

  it("merges two simple $and selectors together", () => {
    const baseSelector = {
      $and: [ { a: 1 }, { b: 2 } ]
    }
    const newSelector = {
      $and: [ { c: 3 }, { d: 4 } ]
    }
    const mergedSelector = mergeSelectors(baseSelector, newSelector)
    expect(mergedSelector).toEqual({
      $and: [ { a: 1 }, { b: 2 }, { c: 3 }, { d: 4 } ]
    })
  })
})
