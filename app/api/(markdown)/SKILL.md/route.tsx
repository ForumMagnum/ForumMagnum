import { NextRequest } from "next/server";

export const markdownApiDocumentationMarkdown = `
LessWrong: A site dedicated to improving the art of rationality

Finding content to read:
 * /api/latest
Reading posts:
 * /api/post/[id]
`;

export function GET(req: NextRequest) {
  return new Response(markdownApiDocumentationMarkdown);
}
