import { normalizeQuotedReactions, normalizeReactionQuote } from "../lib/voting/reactionDisplayHelpers";
import type { UserReactInfo } from "../lib/voting/namesAttachedReactions";

describe("reaction display helpers", () => {
  it("normalizes quote identity the same way as rendered quote matching", () => {
    expect(normalizeReactionQuote("\r\n  selected text \r\n")).toBe("selected text");
  });

  it("merges the identity of quote whitespace variants", () => {
    const reactions: UserReactInfo[] = [
      {
        userId: "first-user",
        reactType: "created",
        displayName: "First user",
        karma: 10,
        quotes: ["selected text"],
      },
      {
        userId: "second-user",
        reactType: "seconded",
        displayName: "Second user",
        karma: 20,
        quotes: [" selected text\r\n"],
      },
    ];

    const normalizedReactions = normalizeQuotedReactions(reactions);

    expect(normalizedReactions.map(reaction => reaction.quotes?.[0])).toEqual([
      "selected text",
      "selected text",
    ]);
  });

  it("splits legacy multi-quote reactions while preserving non-inline reactions", () => {
    const reactions: UserReactInfo[] = [
      {
        userId: "inline-user",
        reactType: "created",
        displayName: "Inline user",
        karma: 10,
        quotes: [" first quote ", "\rsecond quote\r"],
      },
      {
        userId: "whole-document-user",
        reactType: "created",
        displayName: "Whole document user",
        karma: 20,
      },
    ];

    expect(normalizeQuotedReactions(reactions)).toEqual([
      {
        ...reactions[0],
        quotes: ["first quote"],
      },
      {
        ...reactions[0],
        quotes: ["second quote"],
      },
      reactions[1],
    ]);
  });
});
