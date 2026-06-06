import { PostsViews } from "../lib/collections/posts/views";
import { nullKarmaInflationSeries, setKarmaInflationSeries } from "../lib/collections/posts/karmaInflation";

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

    const terms: PostsViewTerms = {
      view: "tagRelevance",
      tagId,
      sortedBy: "topAdjusted",
      filterSettings: {
        tags: [{ tagId, tagName: "Test tag", filterMode: "Required" }],
      },
      limit: 15,
    };
    const defaultView = PostsViews.getDefaultView();
    if (!defaultView) {
      throw new Error("PostsViews is missing a default view");
    }
    const defaultParameters = defaultView(terms);
    const tagRelevanceParameters = PostsViews.getView("tagRelevance")(terms);

    expect(tagRelevanceParameters.options?.sort).toMatchObject({
      karmaInflationAdjustedScore: -1,
    });
    expect(defaultParameters.syntheticFields).toHaveProperty("karmaInflationAdjustedScore");
  });
});
