import { htmlToTextDefault } from "@/lib/htmlToText";

export interface CommonMisunderstanding {
  /** The misunderstanding in one sentence, shown in bold */
  summary: string;
  detail: string;
}

export interface AppealReason {
  id: string;
  label: string;
  /** Names of the rejection moderation templates that this reason is recognized by */
  moderationTemplateNames: string[];
  /** The site policy behind this reason, which we ask people to read before requesting a review */
  policyLink?: { title: string, url: string };
  /** Common misunderstandings behind appeals of valid rejections for this reason */
  commonMisunderstandings: CommonMisunderstanding[];
}

export const APPEAL_REASONS: AppealReason[] = [
  {
    id: "llmWritten",
    label: "LLM-written or LLM-edited content",
    moderationTemplateNames: ["No LLM", "No LLM (autoreject)", "Potentially / Partially LLM"],
    policyLink: {
      title: "our policy on LLM-generated content",
      url: "/posts/nQWavk9mnwcv6ScMR/new-lesswrong-editor-also-an-update-to-our-llm-policy#Policy_on_LLM_Use",
    },
    commonMisunderstandings: [
      {
        summary: "The No LLM policy does not make exceptions for translation, cognitive diversity (e.g. ADHD) or any other reasons for using AI assistance.",
        detail: "The problem is that AI outputs reliably do not meet our quality standards regardless of the reason for use, and even AI editing tends to change the output rather a lot.",
      },
      {
        summary: "The No LLM policy also excludes using the AI to flesh out or write up your own reasoning or ideas.",
        detail: "As in the above point, the AI will tend to change the content, and the quality bar is typically not met.",
      },
      {
        summary: "The No LLM policy covers both using AI to write your content and also content regarding AI by new users.",
        detail: "In particular, the policy does not allow new users to post about AI consciousness, welfare, self-awareness, and similar AI-centric topics. Unfortunately we get too many low quality submissions on these topics and therefore require new users to prove their quality and understanding of LessWrong norms on other topics.",
      },
    ],
  },
];

function htmlToComparableText(html: string): string {
  return htmlToTextDefault(html)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * The ids of the appeal reasons whose moderation template was used in the
 * rejection message, recognized by the template's opening text appearing in it.
 */
export function getReasonIdsMatchingRejection(
  rejectedReason: string | null,
  templates: { name: string | null, contents: { html: string | null } | null }[],
): string[] {
  if (!rejectedReason) return [];
  const rejectionText = htmlToComparableText(rejectedReason);
  return APPEAL_REASONS.filter(reason => reason.moderationTemplateNames.some(templateName => {
    const templateHtml = templates.find(template => template.name === templateName)?.contents?.html;
    if (!templateHtml) return false;
    // Templates can contain placeholders like {{firstName}}, which are filled in
    // before sending, so match on the longest stretch of text without one.
    const templateSegments = htmlToComparableText(templateHtml).split(/\{\{[^}]*\}\}/);
    const longestSegment = templateSegments.reduce((longest, segment) => segment.length > longest.length ? segment : longest, "");
    const templateExcerpt = longestSegment.trim().slice(0, 80);
    return templateExcerpt.length >= 20 && rejectionText.includes(templateExcerpt);
  })).map(reason => reason.id);
}
