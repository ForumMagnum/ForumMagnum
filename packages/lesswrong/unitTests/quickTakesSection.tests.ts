import { mergeQuickTakesWithFreshSlot } from "@/components/quickTakes/QuickTakesSection";
import { getShortformFrontpageSort } from "@/lib/collections/comments/views";

const item = (_id: string) => ({ _id });

describe("mergeQuickTakesWithFreshSlot", () => {
  it("replaces the final initially-visible ranked item with the newest eligible quick take", () => {
    const rankedResults = ["top-1", "top-2", "top-3", "top-4", "top-5", "top-6", "top-7"]
      .map(item);
    const freshResult = item("fresh");

    expect(mergeQuickTakesWithFreshSlot(rankedResults, freshResult, 7).map((result) => result._id))
      .toEqual(["top-1", "top-2", "top-3", "top-4", "top-5", "top-6", "fresh", "top-7"]);
  });

  it("does not duplicate the fresh quick take after load-more", () => {
    const rankedResults = ["top-1", "top-2", "top-3", "top-4", "top-5", "top-6", "top-7", "fresh", "top-8"]
      .map(item);
    const freshResult = item("fresh");

    expect(mergeQuickTakesWithFreshSlot(rankedResults, freshResult, 7).map((result) => result._id))
      .toEqual(["top-1", "top-2", "top-3", "top-4", "top-5", "top-6", "fresh", "top-7", "top-8"]);
  });

  it("keeps the ranked list unchanged when the fresh quick take is already initially visible", () => {
    const rankedResults = ["top-1", "fresh", "top-2"].map(item);
    const freshResult = item("fresh");

    expect(mergeQuickTakesWithFreshSlot(rankedResults, freshResult, 7).map((result) => result._id))
      .toEqual(["top-1", "fresh", "top-2"]);
  });
});

describe("getShortformFrontpageSort", () => {
  it("uses the existing score sort by default", () => {
    expect(getShortformFrontpageSort()).toEqual({
      score: -1,
      lastSubthreadActivity: -1,
      postedAt: -1,
    });
  });

  it("supports newest-first sorting for the fresh quick take slot", () => {
    expect(getShortformFrontpageSort("new")).toEqual({ postedAt: -1 });
  });
});
