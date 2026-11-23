import { highlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRules";
import { highlightRuleMatches } from "@/components/sunshineDashboard/supermod/declarativeHighlightRules";

const comment = (html: string) => ({ _id: html, contents: { html } });
const cases: [string, boolean][] = [
  ['<p><span style="white-space:pre-wrap">greatest fanfic of all time 😭</span></p>', true],
  ['<p><b><span style="white-space:pre-wrap">Honestly, this is incredible! As someone who has read the books countless times, I really like it.</span></b></p>', true],
  ['<p>This is fine. so is this? No.</p>', true],
  ['<p>This is fine. It uses e.g. abbreviations, i.e. these. Also etc. and more.</p>', false],
  ['<p>A normal comment with <strong>one bold phrase</strong> in the middle of a longer sentence here.</p>', false],
];

describe("tmp formatting rule", () => {
  it.each(cases)("%s -> %s", (html, expected) => {
    const content = comment(html);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base: any = { user: { displayName: "x" }, moderatorActions: [], posts: [], comments: [content] };
    expect(highlightRuleMatches(highlightRuleOverrides.rejectionTemplates["Formatting"], { ...base, focusedContent: content })).toBe(expected);
    expect(highlightRuleMatches(highlightRuleOverrides.messageTemplates["Formatting / Grammar"], { ...base, focusedContent: null })).toBe(expected);
  });
});
