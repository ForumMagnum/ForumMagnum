import { CommentsViews } from "../lib/collections/comments/views";
import { viewFieldNullOrMissing } from "../lib/utils/viewConstants";

describe("profile comment filters", () => {
  const profileCommentsView = CommentsViews.getView("profileComments");
  const defaultView = CommentsViews.getDefaultView();

  it("categorizes only top-level shortform comments as quick takes", async () => {
    const terms: CommentsViewTerms = {
      view: "profileComments",
      userId: "testUserId",
      shortform: true,
    };

    const params = profileCommentsView(terms);
    const defaultParams = await defaultView?.(terms);

    expect(params.selector).toMatchObject({
      shortform: true,
      parentCommentId: viewFieldNullOrMissing,
    });
    expect(defaultParams?.selector).not.toHaveProperty("shortform");
  });

  it("includes replies on shortform posts with regular comments", async () => {
    const terms: CommentsViewTerms = {
      view: "profileComments",
      userId: "testUserId",
      shortform: false,
    };

    const params = profileCommentsView(terms);
    const defaultParams = await defaultView?.(terms);

    expect(params.selector).toMatchObject({
      $or: [
        {shortform: {$ne: true}},
        {parentCommentId: {$ne: null}},
      ],
    });
    expect(defaultParams?.selector).not.toHaveProperty("shortform");
  });

  it("preserves raw shortform filtering for other comment views", async () => {
    const terms: CommentsViewTerms = {
      view: "draftComments",
      shortform: true,
    };

    const defaultParams = await defaultView?.(terms);

    expect(defaultParams?.selector).toMatchObject({
      shortform: true,
    });
  });
});
