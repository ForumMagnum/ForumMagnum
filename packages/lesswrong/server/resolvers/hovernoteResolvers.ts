import gql from 'graphql-tag';
import sanitizeHtml from 'sanitize-html';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClientOrThrow } from '../languageModels/anthropicClient';
import { accessFilterSingle } from '@/lib/utils/schemaUtils';
import { userGetDisplayName } from '@/lib/collections/users/helpers';

const MODEL = 'claude-opus-5';
const MAX_DOCUMENT_CHARS = 80_000;
const MAX_PHRASE_CHARS = 500;
const MAX_CONTEXT_CHARS = 2_000;
const MAX_OUTPUT_TOKENS = 8_000;
const MAX_FETCHES = 6;
const MAX_SEARCHES = 3;
/**
 * A turn that used a server tool can come back paused rather than finished
 * (`stop_reason: "pause_turn"`); resuming is re-sending the conversation with
 * the paused assistant turn appended.
 */
const MAX_RESUMES = 4;

const ALLOWED_TAGS = ['p', 'em', 'i', 'strong', 'b', 'a', 'code', 'br', 'ul', 'ol', 'li'];

const SYSTEM_PROMPT = `You write hovernote cards for essays on LessWrong.

A hovernote is the small card a reader sees when they hover a highlighted phrase in the essay body. It exists so the reader can understand an unfamiliar term, name, or idea — or see a supporting detail, source, or caveat — without leaving the page. The card's content is also listed in the essay's footnotes section.

You are given the essay and one highlighted phrase from it. Write that phrase's card.

Voice and shape:
- Match the essay's voice — same register, sentence rhythm, and directness.
- One or two short paragraphs, two or three sentences total, well under 60 words.
- Explain what the phrase refers to in the sense this essay uses it, or supply the concrete detail (a number, a source, a definition) the highlighted claim rests on. Don't restate the sentence it sits in, don't pitch, don't hedge.

Research:
- Use the web_search tool to find what the phrase refers to when the essay doesn't already tell you — search for the canonical source, then use web_fetch on the best candidate to confirm it is what the essay means. Bare domains in href attributes (e.g. "example.com") are absolute URLs missing their scheme; prepend https://.
- Use web_fetch on any absolute URL already in the essay that carries the needed context.
- Skip searching and fetching entirely when the essay already tells you everything the card needs.
- If your research surfaces a canonical source worth citing, include at most one <a href> link to it inside the card.

Reply with only the card's HTML: <p> paragraphs, with <em>, <strong>, or <a href> inside if they earn their place. No markdown, no code fences, no headings, no commentary.`;

const clamp = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

interface HovernotePromptArgs {
  documentHtml: string;
  phrase: string;
  surroundingText: string;
  postTitle: string | null;
  authorName: string | null;
}

function buildPrompt({ documentHtml, phrase, surroundingText, postTitle, authorName }: HovernotePromptArgs): string {
  return [
    postTitle ? `The essay is titled "${postTitle}"${authorName ? `, by ${authorName}` : ''}.` : null,
    '<essay>',
    clamp(documentHtml, MAX_DOCUMENT_CHARS),
    '</essay>',
    '',
    `The highlighted phrase needing a hovernote: ${clamp(phrase, MAX_PHRASE_CHARS)}`,
    surroundingText ? `Where it appears: ${clamp(surroundingText, MAX_CONTEXT_CHARS)}` : null,
  ].filter((line) => line !== null).join('\n');
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

async function generateCard(client: Anthropic, prompt: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  let text = '';

  for (let resume = 0; ; resume++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      thinking: { type: 'adaptive' },
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES },
        { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: MAX_FETCHES },
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') {
      throw new Error('The model declined to write this note');
    }
    // Concatenated with no separator: a resume continues the same output, and
    // an inserted newline could land mid-tag.
    text += textOf(response.content);
    if (response.stop_reason !== 'pause_turn' || resume >= MAX_RESUMES) {
      return text;
    }
    messages.push({ role: 'assistant', content: response.content });
  }
}

/**
 * A turn that searched often opens by narrating it ("I'll look that up."), so
 * start the card at its first tag rather than taking the text wholesale.
 */
function extractCardHtml(text: string): string {
  const answer = text.trim().replace(/^```(?:html)?\n?|\n?```$/g, '').trim();
  const opening = answer.search(/<(?:p|ul|ol)\b/);
  const cardHtml = opening === -1 ? answer : answer.slice(opening);
  return sanitizeHtml(cardHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https'],
  }).trim();
}

export const hovernoteGqlTypeDefs = gql`
  extend type Mutation {
    generateHovernoteSuggestion(phrase: String!, surroundingText: String, documentHtml: String!, postId: String): String!
  }
`;

interface GenerateHovernoteSuggestionArgs {
  phrase: string;
  surroundingText?: string | null;
  documentHtml: string;
  postId?: string | null;
}

export const hovernoteGqlMutations = {
  async generateHovernoteSuggestion(
    _root: void,
    { phrase, surroundingText, documentHtml, postId }: GenerateHovernoteSuggestionArgs,
    context: ResolverContext,
  ): Promise<string> {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('You need to be logged in to autogenerate hovernotes');
    }
    // TODO: this is an expensive endpoint (Opus + web search over up to 80K
    // chars) gated only on login, matching who can use the editor. Before any
    // broad rollout it should get a per-user rate limit and/or the same kind
    // of capability gate as jargon generation.
    const trimmedPhrase = phrase.trim();
    if (!trimmedPhrase || !documentHtml.trim()) {
      throw new Error('Missing phrase or document');
    }

    // Post title and author, for context — only if the post exists and this
    // user is allowed to read it.
    let postTitle: string | null = null;
    let authorName: string | null = null;
    if (postId) {
      const post = await context.loaders.Posts.load(postId);
      const filteredPost = await accessFilterSingle(currentUser, 'Posts', post, context);
      if (filteredPost) {
        postTitle = filteredPost.title ?? null;
        const author = filteredPost.userId ? await context.loaders.Users.load(filteredPost.userId) : null;
        authorName = author ? userGetDisplayName(author) : null;
      }
    }

    const client = getAnthropicClientOrThrow();
    const prompt = buildPrompt({
      documentHtml,
      phrase: trimmedPhrase,
      surroundingText: surroundingText ?? '',
      postTitle,
      authorName,
    });

    const text = await generateCard(client, prompt);
    const html = extractCardHtml(text);
    if (!html) {
      throw new Error('The model returned an empty suggestion');
    }
    return html;
  },
};
