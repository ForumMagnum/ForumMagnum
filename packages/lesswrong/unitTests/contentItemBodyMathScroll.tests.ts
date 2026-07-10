import { rootTagShouldBeHorizontallyScrollable } from "@/components/contents/ContentItemBody";

describe("rootTagShouldBeHorizontallyScrollable", () => {
  it("wraps root-level MathJax display equations", () => {
    expect(rootTagShouldBeHorizontallyScrollable("mjx-container", { display: "true" })).toBe(true);
  });

  it("does not wrap inline MathJax equations", () => {
    expect(rootTagShouldBeHorizontallyScrollable("mjx-container", { display: "false" })).toBe(false);
    expect(rootTagShouldBeHorizontallyScrollable("mjx-container", {})).toBe(false);
  });

  it("preserves existing scrollable root tags", () => {
    expect(rootTagShouldBeHorizontallyScrollable("p", {})).toBe(true);
    expect(rootTagShouldBeHorizontallyScrollable("table", {})).toBe(true);
    expect(rootTagShouldBeHorizontallyScrollable("figure", {})).toBe(true);
  });
});
