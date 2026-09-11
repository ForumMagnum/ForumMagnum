import { generateText } from "ai";
import { captureException } from "@/lib/sentryWrapper";
import { htmlToTextDefault } from "@/lib/htmlToText";

const TITLE_MODEL = "anthropic/claude-haiku-4-5";
const TITLE_MAX_TOKENS = 50;
const MIN_DOCUMENT_BODY_LENGTH = 300;
const MAX_PROMPT_INPUT_LENGTH = 4000;

const CONVERSATION_TITLE_INSTRUCTIONS =
  "Generate a concise 2-5 word title for the research conversation below, " +
  "based on the user's first message. The title should capture the specific " +
  "topic. Reply with only the title.";

const DOCUMENT_TITLE_INSTRUCTIONS =
  "Generate a concise 2-5 word title for the research document below. The title " +
  "should capture the specific topic. Reply with only the title.";

async function callTitleModel(systemInstructions: string, body: string): Promise<string | null> {
  try {
    const result = await generateText({
      model: TITLE_MODEL,
      system: systemInstructions,
      prompt: body.slice(0, MAX_PROMPT_INPUT_LENGTH),
      maxOutputTokens: TITLE_MAX_TOKENS,
    });
    const title = result.text.trim();
    return title || null;
  } catch (err) {
    captureException(err);
    // eslint-disable-next-line no-console
    console.error("[research] Title generation failed", err);
    return null;
  }
}

// Returns null on failure, empty input, or when the model emits nothing usable
// — callers should leave `title` null in that case so the UI falls back to
// "Untitled conversation".
export async function generateConversationTitle(firstUserPrompt: string): Promise<string | null> {
  const trimmed = firstUserPrompt.trim();
  if (!trimmed) return null;
  return callTitleModel(CONVERSATION_TITLE_INSTRUCTIONS, trimmed);
}

// Returns null when the body is too short to summarize meaningfully, or on
// model failure — callers leave `title` null in that case.
export async function generateDocumentTitle(html: string): Promise<string | null> {
  const plainText = htmlToTextDefault(html).trim();
  if (plainText.length < MIN_DOCUMENT_BODY_LENGTH) return null;
  return callTitleModel(DOCUMENT_TITLE_INSTRUCTIONS, plainText);
}
