import { cheerioParse } from "../utils/htmlUtil";

/**
 * Preprocess HTML before converting to markdown to be then converted into a
 * language model prompt. Strips links, and replaces images with their alt text
 * or with "IMAGE". We do this to prevent URLs (which tend to be long, and
 * uninformative, and prone to future distribution shifts if we change how our
 * image hosting works) from chewing up limited context-window space.
 *
 * TODO: Replace images with their alt text
 * TODO: Replace any Unicode characters that are going to cause trouble for the GPT-3 tokenizer
 */
export function preprocessHtml(html: string): string {
  const $ = cheerioParse(html) as any;
  $('a').contents().unwrap();
  return $.html();
}

export function postprocessMarkdown(markdown: string): string {
  // Replace the string <|endoftext|> with __endoftext__ because the former is
  // special to the tokenizer (and will cause input-validation to fail), and it
  // tends to appear in posts that talk about LLMs.
  return markdown.replace(/<\|endoftext\|>/g, "__endoftext__");
}
