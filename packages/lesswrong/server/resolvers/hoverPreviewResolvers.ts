import gql from "graphql-tag";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { sanitize } from "@/lib/utils/sanitize";
import { getUrlClass } from "@/server/utils/getUrlClass";
import type { ContentBlock, MessageParam, ToolUnion } from "@anthropic-ai/sdk/resources/messages.mjs";
import { userCanAutogenerateHoverPreviews } from "@/lib/betas";

// claude-fable-5 is more capable, at roughly twice the price.
const HOVER_PREVIEW_MODEL = 'claude-opus-4-8';

const MAX_DOCUMENT_CHARS = 80_000;
const MAX_PHRASE_CHARS = 500;
const MAX_SURROUNDING_CHARS = 2_000;
const MAX_OUTPUT_TOKENS = 4_000;
const MAX_SEARCHES = 5;
const MAX_FETCHES = 5;

const SYSTEM_PROMPT = `You write hover-preview cards for links in a LessWrong post.

A hover preview is the small card a reader sees when they hover a linked phrase in the post body. It exists so the reader can understand an unfamiliar term, name, or idea without leaving the page — it replaces the preview the destination would otherwise get.

You are given the full post and one phrase from it. Write that phrase's card.

Voice and shape:
- Match the post's voice: same register, sentence rhythm, and directness.
- One or two short paragraphs, two or three sentences total, well under 60 words.
- Explain what the phrase refers to in the sense this post uses it. Don't restate the sentence it sits in, don't pitch, don't hedge.

Research:
- Use web_fetch on the phrase's own link when it has one, to describe the destination accurately.
- When the phrase has no link, use web_search to find its canonical home page, then web_fetch to confirm.
- Skip research entirely when the post already tells you everything the card needs.

The phrase's own link:
- When you are told it already links somewhere, leave "href" empty — the post has committed to that destination.
- Otherwise, if the phrase names something with an obvious canonical home page that you found and confirmed, put that URL in "href". A project's or organisation's own site, not a third-party write-up.
- Leave "href" empty whenever you are unsure, or when the phrase names an idea rather than a place. A wrong link is worse than none.

Reply with exactly one line reading HREF: followed by that URL — or HREF: none — and then the card's HTML on the lines after it: <p> paragraphs, with <em>, <strong>, or <a href> inside if they earn their place. No markdown, no code fences, no headings, no commentary.`;

// This lands in someone's post, and parsing is not enough on its own:
// a bare "N/A" is a valid URL path.
function safeSuggestedHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return '';
  }
  const URLClass = getUrlClass();
  try {
    const url = new URLClass(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return /^[\w-]+(\.[\w-]+)*\.[a-z]{2,}$/i.test(url.hostname) ? url.toString() : '';
  } catch {
    return '';
  }
}

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function buildPrompt({ documentHtml, phrase, surroundingText, href }: {
  documentHtml: string,
  phrase: string,
  surroundingText: string,
  href: string,
}): string {
  return [
    '<post>',
    clamp(documentHtml, MAX_DOCUMENT_CHARS),
    '</post>',
    '',
    `The phrase needing a hover preview: ${clamp(phrase, MAX_PHRASE_CHARS)}`,
    href
      ? `It already links to: ${href} — leave "href" empty.`
      : 'It has no link yet. Suggest one in "href" only if you found and confirmed a canonical home page for it.',
    surroundingText ? `Where it appears: ${clamp(surroundingText, MAX_SURROUNDING_CHARS)}` : null,
  ].filter(Boolean).join('\n');
}

/**
 * A leading HREF: line rather than JSON, because card HTML is full of
 * quotes and one unescaped quote would cost the whole response.
 */
function parseSuggestion(text: string): { html: string, suggestedHref: string } {
  const answer = text.trim().replace(/^```(?:html)?\n?|\n?```$/g, '').trim();
  const header = answer.match(/^HREF:[^\S\n]*(.*?)[^\S\n]*(?:\n|$)/i);
  return {
    suggestedHref: header ? header[1] : '',
    html: header ? answer.slice(header[0].length) : answer,
  };
}

function collectResponseText(content: ContentBlock[]): string {
  return content.filter(block => block.type === 'text').map(block => block.text).join('');
}

/**
 * Search is offered only when the phrase has no link: once the author
 * has chosen a destination, the model's job is just to describe it.
 */
function toolsForRequest(hasHref: boolean): ToolUnion[] {
  const webFetch: ToolUnion = { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: MAX_FETCHES };
  if (hasHref) {
    return [webFetch];
  }
  return [{ type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES }, webFetch];
}

async function generateHoverPreview({ documentHtml, phrase, surroundingText, href }: {
  documentHtml: string,
  phrase: string,
  surroundingText: string,
  href: string,
}): Promise<{ html: string, href: string }> {
  const client = getAnthropicClientOrThrow();
  const messages: MessageParam[] = [{
    role: 'user',
    content: buildPrompt({ documentHtml, phrase, surroundingText, href }),
  }];

  // Search plus serial fetches runs past the non-streaming timeout.
  const stream = client.messages.stream({
    model: HOVER_PREVIEW_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    thinking: { type: 'adaptive' },
    messages,
    tools: toolsForRequest(!!href),
  });
  const response = await stream.finalMessage();

  const { html, suggestedHref } = parseSuggestion(collectResponseText(response.content));
  const sanitizedHtml = sanitize(html).trim();
  if (!sanitizedHtml) {
    throw new Error('The model did not return a usable hover preview');
  }

  return {
    html: sanitizedHtml,
    // Never replace a link the author already chose.
    href: href ? '' : safeSuggestedHref(suggestedHref),
  };
}

export const hoverPreviewGraphQLTypeDefs = gql`
  type HoverPreviewSuggestion {
    html: String!
    href: String!
  }
  extend type Mutation {
    generateHoverPreview(documentHtml: String!, phrase: String!, surroundingText: String, href: String): HoverPreviewSuggestion!
  }
`

export const hoverPreviewGraphQLMutations = {
  generateHoverPreview: async (
    root: void,
    { documentHtml, phrase, surroundingText, href }: {
      documentHtml: string,
      phrase: string,
      surroundingText?: string | null,
      href?: string | null,
    },
    context: ResolverContext,
  ) => {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('You need to be logged in to generate a hover preview');
    }
    if (!userCanAutogenerateHoverPreviews(currentUser)) {
      throw new Error('This feature is not yet available to all users');
    }
    if (!documentHtml.trim() || !phrase.trim()) {
      throw new Error('A hover preview needs both the document and the phrase it describes');
    }
    return await generateHoverPreview({
      documentHtml,
      phrase: phrase.trim(),
      surroundingText: surroundingText ?? '',
      href: href?.trim() ?? '',
    });
  },
}
