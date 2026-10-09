import { getReasonIdsMatchingRejection } from '@/lib/collections/rejectionAppeals/appealReasons';

const templates = [
  {
    name: "No LLM",
    contents: { html: "<p><strong>No LLM generated, assisted/co-written, or edited work.</strong> LessWrong has recently been inundated with new users submitting work where much of the content is the output of LLM(s).</p>" },
  },
  {
    name: "Potentially / Partially LLM",
    contents: { html: "<p>Hey {{firstName}},</p><p>Sometimes we get posts or comments where it's not clearly human generated. Or, posts with some LLM content that are not in LLM content blocks.</p>" },
  },
  {
    name: "Insufficient quality",
    contents: { html: "<p>LessWrong has a particularly high bar for content from new users and this contribution doesn't quite meet the bar.</p>" },
  },
];

describe("getReasonIdsMatchingRejection", () => {
  it("matches a reason whose template text appears in the rejection message", () => {
    const rejectedReason = "<p>Unfortunately, I rejected your post.</p><p><strong>No LLM generated, assisted/co-written, or edited work.</strong>&nbsp;LessWrong has recently been inundated with new users submitting work where much of the content is the output of LLM(s).</p>";
    expect(getReasonIdsMatchingRejection(rejectedReason, templates)).toEqual(["llmWritten"]);
  });

  it("matches templates with placeholders that were filled in before sending", () => {
    const rejectedReason = "<p>Hey Alice,</p><p>Sometimes we get posts or comments where it's not clearly human generated. Or, posts with some LLM content that are not in LLM content blocks.</p>";
    expect(getReasonIdsMatchingRejection(rejectedReason, templates)).toEqual(["llmWritten"]);
  });

  it("matches nothing when the rejection used a template without an appeal reason", () => {
    const rejectedReason = "<p>LessWrong has a particularly high bar for content from new users and this contribution doesn't quite meet the bar.</p>";
    expect(getReasonIdsMatchingRejection(rejectedReason, templates)).toEqual([]);
    expect(getReasonIdsMatchingRejection(null, templates)).toEqual([]);
  });
});
