export type AiDigestSectionKind = "recommendations" | "discussion" | "curated";

export type AiDigestDocumentRef =
  | { documentType: "post"; documentId: string }
  | { documentType: "comment"; documentId: string }
  | { documentType: "quickTake"; documentId: string };

export type AiDigestPlacement = "headline" | "compact" | "full" | "quiet";

export interface AiDigestThreadComment {
  commentId: string;
  /** A literal author-written passage selected for this email. */
  excerpt?: string;
}

export interface AiDigestItem {
  documentRef: AiDigestDocumentRef;
  /** Omitted for quiet items (e.g. the curated module), which carry no personalized reason. */
  reason?: string;
  placement: AiDigestPlacement;
  /**
   * Whether the recipient had already read this post when the digest was
   * generated. Quiet curated items render with a greyed-out title when true.
   */
  isRead?: boolean;
  /** A literal author-written passage selected for this email. */
  excerpt?: string;
  /** For discussion items: selected replies and their literal excerpts. */
  threadComments?: AiDigestThreadComment[];
}

export interface AiDigestSection {
  kind: AiDigestSectionKind;
  /** Omitted for sections that render without a heading (e.g. recommendations). */
  title?: string;
  items: AiDigestItem[];
}

export interface AiDigestAiNote {
  modelName: string;
  paragraphs: string[];
}

export interface AiDigestSpec {
  recipientName: string;
  subject: string;
  /** Hidden preview text shown after the subject in most email clients. */
  preheader: string;
  /** One to three short paragraphs explaining the personalized recommendations. */
  aiNote: AiDigestAiNote;
  /** The reader's own custom instructions, echoed back beneath the AI note. */
  personalInstructions?: string;
  sections: AiDigestSection[];
}

/**
 * A design fixture made from real, public LessWrong content. The selections are
 * intentionally explicit so the email can be iterated on before the generation
 * and persistence layers exist.
 */
export const rubyAiDigestSpec: AiDigestSpec = {
  recipientName: "Ruby",
  subject: "Our response to Séb Krier on Plan A — plus 9 more",
  preheader:
    "Also: an analysis of AI-generated content at the interpretability workshop, Buck on the mech interp disagreement, and a comment from Eliezer Yudkowsky.",
  aiNote: {
    modelName: "GPT-5.6 Sol",
    paragraphs: [
      "Based on your recent reading and votes, I think you’re currently interested in Plan A, mechanistic interpretability, the political economy of AI, and practical self-experiments.",
      "The picks you might not expect: Buck saying his mech-interp disagreement with Neel Nanda has mostly dissolved, and a comment thread on the economics of slavery.",
    ],
  },
  sections: [
    {
      kind: "recommendations",
      items: [
        {
          documentRef: {
            documentType: "post",
            documentId: "RPgHythvMKh6eG9pS",
          },
          placement: "headline",
        },
        {
          documentRef: {
            documentType: "post",
            documentId: "r7FBQ8XDs6qBYc4K4",
          },
          placement: "headline",
        },
        {
          documentRef: {
            documentType: "post",
            documentId: "nSqB3qYP36enJLRq2",
          },
          placement: "compact",
        },
        {
          documentRef: {
            documentType: "post",
            documentId: "gS5skwXeeQdStwsPu",
          },
          placement: "compact",
        },
        {
          documentRef: {
            documentType: "post",
            documentId: "kw33A6uYPGRtvD43s",
          },
          placement: "compact",
        },
        {
          documentRef: {
            documentType: "quickTake",
            documentId: "Fw6JwHFB655wGjiM6",
          },
          reason:
            "You followed the Buck–Neel disagreement over mech interp; here Buck says it has mostly dissolved.",
          placement: "full",
        },
      ],
    },
    {
      kind: "discussion",
      title: "From the discussion",
      items: [
        {
          documentRef: {
            documentType: "comment",
            documentId: "BKjZBnMeGhrmMpXz5",
          },
          reason:
            "Sharpens the corrigibility question beneath several of the alignment posts in your recent reading.",
          placement: "full",
          threadComments: [{ commentId: "dtktqKGyDhqQBjjJW" }],
        },
        {
          documentRef: {
            documentType: "comment",
            documentId: "BgYaXmt4rdKvTkHSE",
          },
          reason:
            "A step outside your usual AI reading—picked because you’ve engaged with economic-history arguments before.",
          placement: "full",
          threadComments: [{ commentId: "NjEg7TsT2tuw4XoZ6" }],
        },
      ],
    },
    {
      kind: "curated",
      title: "Recently curated",
      items: [
        {
          documentRef: {
            documentType: "post",
            documentId: "d8xDGzCEYE639qqEv",
          },
          placement: "quiet",
        },
        {
          documentRef: {
            documentType: "post",
            documentId: "xiTBpBDwubnr4MLRe",
          },
          placement: "quiet",
        },
      ],
    },
  ],
};
