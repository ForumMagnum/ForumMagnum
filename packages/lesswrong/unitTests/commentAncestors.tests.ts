import { collectAncestorCommentIds } from "@/server/markdownApi/commentAncestors";

const makeLoader = (parents: Record<string, string | null>) => {
  return async (commentId: string): Promise<string | null> => {
    return parents[commentId] ?? null;
  };
};

describe("collectAncestorCommentIds", () => {
  it("returns the ancestor chain root-first", async () => {
    // c3 -> c2 -> c1 (root); walking from c3's parent
    const loader = makeLoader({ c2: "c1", c1: null });
    const result = await collectAncestorCommentIds("c2", loader);
    expect(result).toEqual(["c1", "c2"]);
  });

  it("returns an empty chain for a top-level comment", async () => {
    const result = await collectAncestorCommentIds(null, makeLoader({}));
    expect(result).toEqual([]);
  });

  it("terminates on a cycle, including each id once", async () => {
    const loader = makeLoader({ a: "b", b: "a" });
    const result = await collectAncestorCommentIds("a", loader);
    expect(result).toEqual(["b", "a"]);
  });

  it("respects the depth cap", async () => {
    const parents: Record<string, string | null> = {};
    for (let i = 0; i < 20; i++) {
      parents[`c${i}`] = `c${i + 1}`;
    }
    const result = await collectAncestorCommentIds("c0", makeLoader(parents), 5);
    expect(result).toEqual(["c4", "c3", "c2", "c1", "c0"]);
  });

  it("ends the walk when a parent is missing", async () => {
    const loader = makeLoader({ c2: "deleted" });
    const result = await collectAncestorCommentIds("c2", loader);
    expect(result).toEqual(["deleted", "c2"]);
  });
});
