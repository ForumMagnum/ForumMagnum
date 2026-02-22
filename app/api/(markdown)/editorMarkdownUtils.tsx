import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { NextRequest, NextResponse } from "next/server";

export function buildEditMarkdownUrl(postId: string, key?: string, version?: string): string {
  const searchParams = new URLSearchParams({ postId });
  if (key) searchParams.set("key", key);
  if (version) searchParams.set("version", version);
  return `/api/editPost?${searchParams.toString()}`;
}

export function buildCollaborateMarkdownUrl(postId: string, key?: string): string {
  const searchParams = new URLSearchParams({ postId });
  if (key) searchParams.set("key", key);
  return `/api/collaborateOnPost?${searchParams.toString()}`;
}

export function buildEditHtmlUrl(postId: string, key?: string, version?: string): string {
  const searchParams = new URLSearchParams({ postId });
  if (key) searchParams.set("key", key);
  if (version) searchParams.set("version", version);
  return `/editPost?${searchParams.toString()}`;
}

export function buildCollaborateHtmlUrl(postId: string, key?: string): string {
  const searchParams = new URLSearchParams({ postId });
  if (key) searchParams.set("key", key);
  return `/collaborateOnPost?${searchParams.toString()}`;
}

export function markdownRouteRedirect(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url), 302);
}

export async function renderEditorDraftMarkdown({
  title,
  mode,
  postId,
  bodyMarkdown,
  key,
  version,
}: {
  title: string
  mode: "edit" | "collaborate"
  postId: string
  bodyMarkdown: string
  key?: string
  version?: string
}): Promise<Response> {
  const htmlRoute = mode === "edit"
    ? buildEditHtmlUrl(postId, key, version)
    : buildCollaborateHtmlUrl(postId, key);
  const alternateMarkdownRoute = mode === "edit"
    ? buildCollaborateMarkdownUrl(postId, key)
    : buildEditMarkdownUrl(postId, key);

  return markdownResponse(
    <div>
      <div className={markdownClasses.title}>
        {mode === "edit" ? "Edit post draft: " : "Collaborative draft view: "}
        {title}
      </div>
      <div>
        HTML route: <a href={htmlRoute}>{htmlRoute}</a>
      </div>
      <div>
        {mode === "edit" ? "Collaboration route (Markdown): " : "Edit route (Markdown): "}
        <a href={alternateMarkdownRoute}>{alternateMarkdownRoute}</a>
      </div>
      <div>
        Post ID: <code>{postId}</code>
      </div>
      {version ? (
        <div>
          Version: <code>{version}</code>
        </div>
      ) : null}
      <hr />
      <div>{bodyMarkdown}</div>
    </div>
  );
}
