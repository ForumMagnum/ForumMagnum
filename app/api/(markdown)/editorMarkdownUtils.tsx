import { markdownClasses, markdownResponse } from "@/server/markdownApi/markdownResponse";
import { MarkdownNode } from "@/server/markdownComponents/MarkdownNode";
import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { withMainDocEditorSession } from "../agent/editorAgentUtil";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $generateHtmlFromNodes } from "@lexical/html";

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

const HocuspocusAuthQuery = `
  query MarkdownDraftHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

const MarkdownPostMetadataQuery = `
  query MarkdownPostMetadataQuery($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        title
        linkSharingKey
      }
    }
  }
`;

const LinkSharedPostMetadataQuery = `
  query MarkdownLinkSharedPostMetadataQuery($postId: String!, $linkSharingKey: String!) {
    getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
      _id
      title
      linkSharingKey
    }
  }
`;

export function unescapeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function convertWidgetIframesToMarkdownFences(markdown: string): string {
  return markdown.replace(/<iframe[\s\S]*?<\/iframe>/g, (iframeHtml) => {
    if (!iframeHtml.includes("data-lexical-iframe-widget")) {
      return iframeHtml;
    }
    const idMatch = iframeHtml.match(/data-widget-id="([^"]*)"/);
    const widgetId = idMatch?.[1] ?? "";

    const srcdocStart = iframeHtml.indexOf('srcdoc="');
    if (srcdocStart < 0) {
      return iframeHtml;
    }
    const srcdocValueStart = srcdocStart + 'srcdoc="'.length;
    const srcdocValueEnd = iframeHtml.lastIndexOf('"></iframe>');
    if (srcdocValueEnd <= srcdocValueStart) {
      return iframeHtml;
    }
    const rawSrcdoc = iframeHtml.slice(srcdocValueStart, srcdocValueEnd);
    const srcdoc = unescapeHtmlAttribute(rawSrcdoc);
    return `\n\n\`\`\`widget[${widgetId}]\n${srcdoc}\n\`\`\`\n\n`;
  });
}

export async function getLiveDraftMarkdown({
  postId,
  token,
  operationLabel
}: {
  postId: string
  token: string
  operationLabel?: string
}): Promise<string> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: operationLabel ?? "MarkdownReadDraft",
    callback: async ({ editor }) => {
      const html = withDomGlobals(() => {
        let generated = "";
        editor.getEditorState().read(() => {
          generated = $generateHtmlFromNodes(editor, null);
        });
        return generated;
      });
      return convertWidgetIframesToMarkdownFences(htmlToMarkdown(html));
    },
  });
}

export async function renderLiveEditorDraftMarkdownRoute({
  req,
  mode,
}: {
  req: NextRequest
  mode: "edit" | "collaborate"
}): Promise<Response> {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? undefined;
  const version = req.nextUrl.searchParams.get("version") ?? "draft";

  if (!postId) {
    return new Response("No postId provided", { status: 400 });
  }

  try {
    const resolverContext = await getContextFromReqAndRes({ req });
    const { data: authData } = await runQuery(
      HocuspocusAuthQuery,
      { postId, linkSharingKey: key ?? null },
      resolverContext
    );
    const token = authData?.HocuspocusAuth?.token;

    if (!token) {
      return new Response(`No accessible shared draft found for postId: ${postId}`, { status: 403 });
    }

    const post = key
      ? (
        await runQuery(
          LinkSharedPostMetadataQuery,
          { postId, linkSharingKey: key },
          resolverContext
        )
      ).data?.getLinkSharedPost
      : (
        await runQuery(
          MarkdownPostMetadataQuery,
          { documentId: postId },
          resolverContext
        )
      ).data?.post?.result;

    const bodyMarkdown = await getLiveDraftMarkdown({ postId, token });
    const resolvedPostId = post?._id ?? postId;
    const title = post?.title ?? "(untitled draft)";

    return renderEditorDraftMarkdown({
      title,
      mode,
      postId: resolvedPostId,
      key,
      version,
      bodyMarkdown,
    });
  } catch {
    return new Response(`Unable to access shared draft for postId: ${postId}`, { status: 403 });
  }
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
      <MarkdownNode markdown={bodyMarkdown} />
    </div>
  );
}
