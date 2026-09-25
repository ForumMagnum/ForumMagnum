import {
  type EditableChapter,
  addPost,
  canDeleteChapter,
  findPostChapter,
  isChapterless,
  moveChapter,
  movePost,
  removePost,
} from "@/components/sequenceEditor/sequenceStructure";

function chapter(_id: string, postIds: string[], title: string | null = null, descriptionText = ""): EditableChapter {
  return { _id, title, descriptionText, postIds };
}

describe("isChapterless", () => {
  it("is true for a single chapter with no title and no description", () => {
    expect(isChapterless([chapter("a", ["p1"])])).toBe(true);
  });

  it("is false for a single chapter with a title", () => {
    expect(isChapterless([chapter("a", ["p1"], "Part One")])).toBe(false);
  });

  it("is false for a single untitled chapter with a description", () => {
    expect(isChapterless([chapter("a", ["p1"], null, "An intro")])).toBe(false);
  });

  it("treats a whitespace-only title as no title", () => {
    expect(isChapterless([chapter("a", [], "  ")])).toBe(true);
  });

  it("is false for several chapters", () => {
    expect(isChapterless([chapter("a", []), chapter("b", [])])).toBe(false);
  });
});

describe("addPost and removePost", () => {
  it("adds a post to the end of the given chapter", () => {
    const result = addPost([chapter("a", ["p1"]), chapter("b", [])], "b", "p2");
    expect(result.map(c => c.postIds)).toEqual([["p1"], ["p2"]]);
  });

  it("removes a post even if it isn't one the editor could load", () => {
    const result = removePost([chapter("a", ["p1", "someone-elses-draft"])], "a", "someone-elses-draft");
    expect(result[0].postIds).toEqual(["p1"]);
  });

  it("doesn't mutate its input", () => {
    const chapters = [chapter("a", ["p1"])];
    addPost(chapters, "a", "p2");
    expect(chapters[0].postIds).toEqual(["p1"]);
  });
});

describe("movePost", () => {
  const chapters = [chapter("a", ["p1", "p2", "p3"]), chapter("b", ["p4"])];

  it("reorders within a chapter", () => {
    expect(movePost(chapters, "p3", "a", "a", 0)[0].postIds).toEqual(["p3", "p1", "p2"]);
  });

  it("moves to the start of another chapter", () => {
    const result = movePost(chapters, "p2", "a", "b", 0);
    expect(result.map(c => c.postIds)).toEqual([["p1", "p3"], ["p2", "p4"]]);
  });

  it("moves to the end of another chapter", () => {
    const result = movePost(chapters, "p1", "a", "b", 1);
    expect(result.map(c => c.postIds)).toEqual([["p2", "p3"], ["p4", "p1"]]);
  });

  it("clamps an out-of-range index to the end", () => {
    expect(movePost(chapters, "p1", "a", "b", 99)[1].postIds).toEqual(["p4", "p1"]);
  });
});

describe("canDeleteChapter", () => {
  it("allows deleting an empty chapter when there are several", () => {
    expect(canDeleteChapter([chapter("a", ["p1"]), chapter("b", [])], "b")).toBe(true);
  });

  it("refuses a non-empty chapter when there are several", () => {
    expect(canDeleteChapter([chapter("a", ["p1"]), chapter("b", [])], "a")).toBe(false);
  });

  it("allows deleting the last remaining chapter even with posts", () => {
    expect(canDeleteChapter([chapter("a", ["p1"], "Part One")], "a")).toBe(true);
  });

  it("allows deleting a chapter once its posts have been moved out", () => {
    const moved = movePost([chapter("a", ["p1"]), chapter("b", ["p2"])], "p2", "b", "a", 1);
    expect(canDeleteChapter(moved, "b")).toBe(true);
  });
});

describe("moveChapter", () => {
  const chapters = [chapter("a", []), chapter("b", []), chapter("c", [])];

  it("moves a chapter up", () => {
    expect(moveChapter(chapters, "b", "up").map(c => c._id)).toEqual(["b", "a", "c"]);
  });

  it("moves a chapter down", () => {
    expect(moveChapter(chapters, "b", "down").map(c => c._id)).toEqual(["a", "c", "b"]);
  });

  it("does nothing at the edges", () => {
    expect(moveChapter(chapters, "a", "up").map(c => c._id)).toEqual(["a", "b", "c"]);
    expect(moveChapter(chapters, "c", "down").map(c => c._id)).toEqual(["a", "b", "c"]);
  });
});

describe("findPostChapter", () => {
  it("finds the chapter containing a post", () => {
    expect(findPostChapter([chapter("a", ["p1"]), chapter("b", ["p2"])], "p2")?._id).toBe("b");
  });

  it("returns undefined for a post not in the sequence", () => {
    expect(findPostChapter([chapter("a", ["p1"])], "p9")).toBeUndefined();
  });
});
