import { PostsViews } from "../lib/collections/posts/views";
import { nullKarmaInflationSeries, setKarmaInflationSeries } from "../lib/collections/posts/karmaInflation";
import { viewTermsToQuery } from "../lib/utils/viewUtils";

describe("post sorting", () => {
  afterEach(() => {
    setKarmaInflationSeries(nullKarmaInflationSeries);
  });

  it("sorts tag pages by inflation-adjusted karma when requested", () => {
    const tagId = "testTagId";
    setKarmaInflationSeries({
      start: Date.UTC(2020, 0, 1),
      interval: 1000,
      values: [2, 0.5],
    });

    const parameters = viewTermsToQuery(PostsViews, {
      view: "tagRelevance",
      tagId,
      sortedBy: "topAdjusted",
      filterSettings: {
        tags: [{ tagId, tagName: "Test tag", filterMode: "Required" }],
      },
      limit: 15,
    }, {});

    expect(parameters.options.sort).toMatchObject({
      karmaInflationAdjustedScore: -1,
    });
    expect(parameters.syntheticFields).toHaveProperty("karmaInflationAdjustedScore");
  });
});
