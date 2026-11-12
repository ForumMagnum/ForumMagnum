import { $getRoot, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $isExcalidrawNode } from "@/components/lexical/nodes/ExcalidrawNode";
import { sanitize } from "@/lib/utils/sanitize";
import { getPlaintextMainText } from "@/lib/collections/revisions/mainTextFilter";
import { setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

// Representative of Excalidraw's SVG export (with skipInliningFonts): a
// rectangle with a bound text label, and an arrow whose label is cut out of
// the line with a mask.
const DIAGRAM_SVG =
  '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 120" width="230" height="120">' +
  '<!-- svg-source:excalidraw -->' +
  '<metadata></metadata>' +
  '<defs><style class="style-fonts">\n      </style></defs>' +
  '<g stroke-linecap="round" transform="translate(10 10) rotate(0 50 30)">' +
  '<path d="M15 0 L85 0 Q100 0 100 15 L100 45 Q100 60 85 60" stroke="#1e1e1e" stroke-width="2" fill="none"></path>' +
  '</g>' +
  '<g transform="translate(25 22.5) rotate(0 35 12.5)">' +
  '<text x="35" y="17.6" font-family="Excalifont, Xiaolai, Segoe UI Emoji" font-size="20px" fill="#1e1e1e" ' +
  'text-anchor="middle" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">Box label</text>' +
  '</g>' +
  '<mask id="mask-abc_123" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="200">' +
  '<rect x="0" y="0" fill="#fff" width="300" height="200"></rect>' +
  '<rect x="140" y="50" fill="#000" width="40" height="25" opacity="1"></rect>' +
  '</mask>' +
  '<g mask="url(#mask-abc_123)" stroke-linecap="round">' +
  '<g transform="translate(120 40) rotate(0 50 20)"><path d="M0 0 C30 10, 70 30, 100 40" stroke="#1e1e1e" stroke-width="2" fill="none"></path></g>' +
  '</g>' +
  '</svg>';

const SCENE_DATA = JSON.stringify({
  appState: {},
  elements: [{ id: "abc_123", type: "rectangle", x: 0, y: 0, width: 100, height: 60 }],
  files: {},
});

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function diagramHtml({ scene, style }: { scene?: string, style?: string } = {}): string {
  const sceneAttribute = scene !== undefined ? ` data-excalidraw-scene="${escapeAttribute(scene)}"` : "";
  const styleAttribute = style !== undefined ? ` style="${style}"` : "";
  return `<figure class="excalidraw-diagram"${sceneAttribute}${styleAttribute}>${DIAGRAM_SVG}</figure>`;
}

function exportHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return html;
}

interface DiagramNodeInfo {
  data: string
  svg: string
  widthPercent: number | null
}

function getDiagramNodes(editor: LexicalEditor): DiagramNodeInfo[] {
  const diagrams: DiagramNodeInfo[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node: LexicalNode) => {
      if ($isExcalidrawNode(node)) {
        diagrams.push({
          data: node.getData(),
          svg: node.getSvg(),
          widthPercent: node.getWidthPercent(),
        });
      }
    });
  });
  return diagrams;
}

function getRootTextContent(editor: LexicalEditor): string {
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return text;
}

describe("ExcalidrawNode HTML import/export", () => {
  it("imports a diagram's scene data, SVG and width", async () => {
    const editor = await setupEditorWithHtml(diagramHtml({ scene: SCENE_DATA, style: "width:40%" }));
    const diagrams = getDiagramNodes(editor);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].data).toBe(SCENE_DATA);
    expect(diagrams[0].svg).toContain("<svg");
    expect(diagrams[0].svg).toContain("Box label");
    expect(diagrams[0].widthPercent).toBe(40);
  });

  it("doesn't turn the SVG's text into separate nodes", async () => {
    const editor = await setupEditorWithHtml(diagramHtml({ scene: SCENE_DATA }));
    expect(getRootTextContent(editor)).not.toContain("Box label");
  });

  it("imports a diagram nested inside another block", async () => {
    const editor = await setupEditorWithHtml(`<blockquote>${diagramHtml({ scene: SCENE_DATA })}</blockquote>`);
    expect(getDiagramNodes(editor)).toHaveLength(1);
    expect(getRootTextContent(editor)).not.toContain("Box label");
  });

  it("round-trips through HTML export", async () => {
    const editor = await setupEditorWithHtml(diagramHtml({ scene: SCENE_DATA, style: "width:40%" }));
    const html = exportHtml(editor);
    expect(html).toContain('class="excalidraw-diagram excalidraw-diagram_resized"');
    expect(html).toContain("width: 40%");
    expect(html).toContain("Box label");

    const reimported = await setupEditorWithHtml(html);
    const diagrams = getDiagramNodes(reimported);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].data).toBe(SCENE_DATA);
    expect(diagrams[0].widthPercent).toBe(40);
  });

  it("keeps the SVG of a diagram without scene data, so it can still be displayed", async () => {
    const editor = await setupEditorWithHtml(diagramHtml());
    const diagrams = getDiagramNodes(editor);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].data).toBe("[]");
    expect(diagrams[0].svg).toContain("Box label");
  });

  it("ignores figures that aren't diagrams", async () => {
    const editor = await setupEditorWithHtml('<figure class="image"><img src="https://example.com/a.png" alt=""></figure>');
    expect(getDiagramNodes(editor)).toHaveLength(0);
  });
});

describe("sanitize with Excalidraw diagrams", () => {
  it("keeps the diagram's SVG", () => {
    const result = sanitize(diagramHtml({ scene: SCENE_DATA }));
    expect(result).toContain('<figure class="excalidraw-diagram">');
    expect(result).toContain("<svg");
    expect(result).toContain('viewbox="0 0 230 120"');
    expect(result).toContain('<path d="M15 0 L85 0');
    expect(result).toContain('stroke="#1e1e1e"');
    expect(result).toContain('transform="translate(10 10) rotate(0 50 30)"');
    expect(result).toContain('font-family="Excalifont, Xiaolai, Segoe UI Emoji"');
    expect(result).toContain('style="white-space:pre"');
    expect(result).toContain(">Box label</text>");
    expect(result).toContain('<mask id="mask-abc_123"');
    expect(result).toContain('mask="url(#mask-abc_123)"');
  });

  it("removes the scene data (it's only needed for editing)", () => {
    const result = sanitize(diagramHtml({ scene: SCENE_DATA }));
    expect(result).not.toContain("data-excalidraw-scene");
    expect(result).not.toContain("rectangle");
  });

  it("removes <style> elements and comments", () => {
    const result = sanitize(diagramHtml({ scene: SCENE_DATA }));
    expect(result).not.toContain("style-fonts");
    expect(result).not.toContain("<style");
    expect(result).not.toContain("svg-source");
  });

  it("keeps the width of a resized diagram", () => {
    const result = sanitize(diagramHtml({ style: "width:40%" }));
    expect(result).toContain('style="width:40%"');
  });

  it("keeps embedded raster images and references to them", () => {
    const result = sanitize(
      '<svg><defs><symbol id="image-abc"><image href="data:image/png;base64,iVBORw0KGgo=" preserveAspectRatio="none" width="100%" height="100%"></image></symbol></defs>' +
      '<use href="#image-abc" width="50" height="50" opacity="1"></use></svg>'
    );
    expect(result).toContain('<image href="data:image/png;base64,iVBORw0KGgo="');
    expect(result).toContain('<use href="#image-abc"');
  });

  it("keeps links", () => {
    const result = sanitize('<svg><a href="https://example.com" target="_blank" rel="noopener noreferrer"><g></g></a></svg>');
    expect(result).toContain('<a href="https://example.com"');
  });

  it("removes scripts, event handlers and foreignObject", () => {
    const result = sanitize(
      '<svg onload="alert(1)"><script>alert(2)</script>' +
      '<g onclick="alert(3)"><path d="M0 0" onmouseover="alert(4)"></path></g>' +
      '<foreignObject><div><iframe src="https://evil.example.com"></iframe></div></foreignObject>' +
      '<text x="0" y="0">hello</text></svg>'
    );
    expect(result).not.toContain("alert");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onmouseover");
    expect(result).not.toContain("foreignobject");
    expect(result).not.toContain("evil.example.com");
    expect(result).toContain(">hello</text>");
  });

  it("removes animation elements", () => {
    const result = sanitize('<svg><a href="#"><animate attributeName="href" to="javascript:alert(1)"></animate><set attributeName="href" to="javascript:alert(2)"></set><text>x</text></a></svg>');
    expect(result).not.toContain("animate");
    expect(result).not.toContain("<set");
    expect(result).not.toContain("javascript");
  });

  it("removes javascript: links", () => {
    const result = sanitize('<svg><a href="javascript:alert(1)"><text>x</text></a></svg>');
    expect(result).not.toContain("javascript");
  });

  it("removes references to external resources", () => {
    const result = sanitize(
      '<svg>' +
      '<use href="https://evil.example.com/sprite.svg#icon"></use>' +
      '<use href="javascript:alert(1)"></use>' +
      '<image href="https://evil.example.com/tracker.png"></image>' +
      '<image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="></image>' +
      '<g mask="url(https://evil.example.com/mask.svg#m)"></g>' +
      '<path fill="url(https://evil.example.com/paint.svg#p)" d="M0 0"></path>' +
      '<path fill="\\75 rl(https://evil.example.com/paint.svg#p)" d="M0 0"></path>' +
      '</svg>'
    );
    expect(result).not.toContain("evil.example.com");
    expect(result).not.toContain("javascript");
    expect(result).not.toContain("svg+xml");
  });

  it("only allows white-space in text styles", () => {
    const result = sanitize('<svg><text style="white-space: pre; position: fixed; top: 0">x</text></svg>');
    expect(result).toContain('style="white-space:pre"');
    expect(result).not.toContain("position");
  });

  it("removes styles that reference external resources", () => {
    const result = sanitize('<svg><text style="white-space: pre; background: url(https://evil.example.com/x.png)">x</text></svg>');
    expect(result).not.toContain("evil.example.com");
  });
});

describe("plaintext main text with Excalidraw diagrams", () => {
  it("doesn't include diagram labels", () => {
    const mainText = getPlaintextMainText(`<p>Before the diagram.</p>${sanitize(diagramHtml())}<p>After the diagram.</p>`);
    expect(mainText).toContain("Before the diagram.");
    expect(mainText).toContain("After the diagram.");
    expect(mainText).not.toContain("Box label");
  });
});
