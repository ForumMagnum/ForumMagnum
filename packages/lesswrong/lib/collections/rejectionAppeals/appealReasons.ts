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
    label: "LLM-assisted content or restricted AI topics",
    moderationTemplateNames: ["No LLM", "No LLM (autoreject)", "Potentially / Partially LLM", "Insufficient Quality for AI Content"],
    policyLink: {
      title: "our policy on LLM-generated content",
      url: "/posts/nQWavk9mnwcv6ScMR/new-lesswrong-editor-also-an-update-to-our-llm-policy#Policy_on_LLM_Use",
    },
    commonMisunderstandings: [
      {
        summary: "You wrote this yourself, without using LLMs to help you write or edit your content.",
        detail: "We can reconsider this rejection only if all three criteria listed here are true. There are no exceptions for translation, cognitive diversity (e.g. ADHD), or other reasons for using AI to write or edit your content.",
      },
      {
        summary: "You did not chat extensively with LLMs to help you generate the ideas.",
        detail: "Using an LLM briefly the way you'd use a search engine is fine. But if you're treating it more like a coauthor or test subject, we will not reconsider your content.",
      },
      {
        summary: "Your content is not about AI consciousness, recursion, emergence, or novel interpretations of physics.",
        detail: "Examples of work we don't evaluate because it's too time costly include case studies of LLM sentience, emergence, recursion, novel physics interpretations, or AI alignment strategies developed in tandem with an AI coauthor. AIs may seem quite smart but they aren't actually a good judge of the quality of novel ideas. If any of these three criteria are false, sorry, we will not accept your content.",
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
