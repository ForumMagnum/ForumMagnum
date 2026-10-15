import { $getRoot, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { sanitize } from "@/lib/utils/sanitize";
import { getVideoFileUrl, $isVideoFileNode, type VideoFileNode } from "@/components/lexical/embeds/VideoFileEmbed/VideoFileNode";
import { VideoFileEmbedConfig } from "@/components/lexical/plugins/AutoEmbedPlugin";
import { setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

const VIDEO_SRC = "https://huggingface.wtf/video/huggingface-wtf-narrated-opening.mp4";

function exportHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return html;
}

function getVideoFileSrcs(editor: LexicalEditor): string[] {
  const srcs: string[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isVideoFileNode(node)) {
        srcs.push((node as VideoFileNode).getSrc());
      }
    });
  });
  return srcs;
}

describe("getVideoFileUrl", () => {
  it.each([
    VIDEO_SRC,
    "https://example.com/a.webm",
    "http://example.com/path/clip.MOV",
    "https://example.com/clip.m4v?v=2",
    "https://example.com/clip.ogv#t=10",
  ])("matches direct video file links: %s", (url) => {
    expect(getVideoFileUrl(url)).toBe(url);
  });

  it.each([
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "https://example.com/video.mp4.html",
    "https://example.com/page?file=video.mp4",
    "javascript:alert(1)//.mp4",
    "ftp://example.com/video.mp4",
  ])("doesn't match other links: %s", (url) => {
    expect(getVideoFileUrl(url)).toBeNull();
  });

  it("is what the auto-embed config uses to offer an embed", async () => {
    expect(await VideoFileEmbedConfig.parseUrl(VIDEO_SRC)).toEqual({ id: VIDEO_SRC, url: VIDEO_SRC });
    expect(await VideoFileEmbedConfig.parseUrl("https://example.com/page")).toBeNull();
  });
});

describe("video file embed export/import", () => {
  it("exports a <video> player that survives sanitization", async () => {
    const editor = await setupEditorWithHtml(
      `<div class="video-file-preview"><video src="${VIDEO_SRC}" controls preload="metadata" playsinline></video></div>`
    );
    expect(getVideoFileSrcs(editor)).toEqual([VIDEO_SRC]);

    const sanitized = sanitize(exportHtml(editor));
    expect(sanitized).toContain('<div class="video-file-preview">');
    expect(sanitized).toContain(`src="${VIDEO_SRC}"`);
    expect(sanitized).toContain('controls');
    expect(sanitized).toContain('preload="metadata"');
  });

  it("round-trips through saved HTML back into a video file node", async () => {
    const editor = await setupEditorWithHtml(
      `<div class="video-file-preview"><video src="${VIDEO_SRC}" controls preload="metadata" playsinline></video></div>`
    );
    const reimported = await setupEditorWithHtml(sanitize(exportHtml(editor)));
    expect(getVideoFileSrcs(reimported)).toEqual([VIDEO_SRC]);
  });

  it("imports a bare <video> element", async () => {
    const editor = await setupEditorWithHtml(`<video src="${VIDEO_SRC}" controls></video>`);
    expect(getVideoFileSrcs(editor)).toEqual([VIDEO_SRC]);
  });
});
