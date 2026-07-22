import * as htmlparser2 from "htmlparser2";
import {
  containsOnlySuperscriptText,
  rootTagShouldBeHorizontallyScrollable,
} from "@/components/contents/ContentItemBody";

function parseElement(html: string) {
  const element = htmlparser2.parseDocument(html).childNodes[0];
  if (!element) {
    throw new Error("Expected parsed HTML to contain an element");
  }
  return element;
}

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

describe("containsOnlySuperscriptText", () => {
  it("recognizes blocks whose text is entirely superscript", () => {
    const element = parseElement("<p><sup><strong>User:</strong></sup> <sup>Hello</sup></p>");
    expect(containsOnlySuperscriptText(element)).toBe(true);
  });

  it("does not treat mixed inline superscripts as all-superscript text", () => {
    const element = parseElement("<p>E = mc<sup>2</sup></p>");
    expect(containsOnlySuperscriptText(element)).toBe(false);
  });

  it("does not treat empty blocks as all-superscript text", () => {
    const element = parseElement("<p><br></p>");
    expect(containsOnlySuperscriptText(element)).toBe(false);
  });
});
