import { outRedirectDestination, outRedirectLinkRepair } from "@/scripts/unwrapOutRedirectLinks";
import { transformContents } from "@/scripts/contentLinkRepair/content";

const destination = "https://example.com/article?a=1&b=2";
const outLink = `https://www.lesswrong.com/out?url=${encodeURIComponent(destination)}`;

describe("/out redirect link repair", () => {
  it("finds the destination of LW and AF /out links", () => {
    expect(outRedirectDestination(outLink)).toBe(destination);
    expect(outRedirectDestination(`http://alignmentforum.org/out?url=${encodeURIComponent(destination)}`)).toBe(destination);
    expect(outRedirectDestination(`/out?url=${encodeURIComponent(destination)}`)).toBe(destination);
    expect(outRedirectDestination(`${outLink}#section`)).toBe(`${destination}#section`);
    expect(outRedirectDestination(`https://www.lesswrong.com/out?url=${encodeURIComponent(destination + "#own")}#ignored`)).toBe(`${destination}#own`);
  });

  it("ignores other sites' /out links and other LW paths", () => {
    for (const href of [
      `https://forum.effectivealtruism.org/out?url=${encodeURIComponent(destination)}`,
      `https://lesswrong.com.evil.test/out?url=${encodeURIComponent(destination)}`,
      `https://www.lesswrong.com/posts/abc/https://www.lesswrong.com/out?url=${encodeURIComponent(destination)}`,
      destination,
    ]) {
      expect(outRedirectLinkRepair.normalize(href)).toBeNull();
      expect(outRedirectLinkRepair.replace(href)).toBe(href);
    }
  });

  it("reports but leaves unchanged /out links without a valid http(s) destination", () => {
    for (const href of [
      "https://www.lesswrong.com/out",
      `https://www.lesswrong.com/out?url=${encodeURIComponent("javascript:alert(1)")}`,
      "https://www.lesswrong.com/out?url=example.com",
    ]) {
      expect(outRedirectLinkRepair.normalize(href)).toBe(href);
      expect(outRedirectLinkRepair.replace(href)).toBe(href);
      expect(outRedirectDestination(href)).toBeNull();
    }
  });

  it.each(["html", "ckEditorMarkup"])("rewrites %s source and rendered anchors, escaping the destination", type => {
    const data = `<p><a href="${outLink}">${outLink}</a></p>`;
    const result = transformContents({ html: data, originalContents: { type, data } }, outRedirectLinkRepair);
    expect(result.urls).toEqual([outLink]);
    expect(result.html).toBe(`<p><a href="https://example.com/article?a=1&amp;b=2">${outLink}</a></p>`);
    expect(result.originalContents).toEqual({ type, data: result.html });
    expect(transformContents(result, outRedirectLinkRepair).changed).toBe(false);
  });

  it("rewrites DraftJS link entities", () => {
    const draft = {
      blocks: [{ key: "a", text: "link", entityRanges: [{ key: 0, offset: 0, length: 4 }] }],
      entityMap: { 0: { type: "LINK", mutability: "MUTABLE", data: { url: outLink } } },
    };
    const result = transformContents({ html: "", originalContents: { type: "draftJS", data: draft } }, outRedirectLinkRepair);
    expect(result.originalContents?.data).toEqual({
      ...draft,
      entityMap: { 0: { ...draft.entityMap[0], data: { url: destination } } },
    });
  });
});
