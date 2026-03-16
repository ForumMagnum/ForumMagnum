/**
 * Test to verify that colSpan/rowSpan are preserved through Yjs roundtrip.
 * This test reproduces the bug where merged cells in tables show up as
 * merged when editing, but split back up in the published version.
 */
import { JSDOM } from "jsdom";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $isElementNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $isTableCellNode } from "@lexical/table";
import { createBinding } from "@lexical/yjs";
import type { Provider } from "@lexical/yjs";
import * as Y from "yjs";
import { createHeadlessEditor, yjsBinaryToHtml } from "../../../app/hocuspocusWebhook/yjsToHtml";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { runEditorUpdate } from "./lexicalTestHelpers";
import { normalizeImportedTopLevelNodes } from "../../../app/api/(markdown)/editorMarkdownUtils";

function createMockProvider(): Provider {
  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => new Map(),
      off: () => {},
      on: () => {},
      setLocalState: () => {},
      setLocalStateField: () => {},
    },
    connect: () => {},
    disconnect: () => {},
    off: () => {},
    on: () => {},
  };
}

/**
 * HTML for a simple 2x2 table where the top-left cell spans 2 columns.
 */
const TABLE_WITH_COLSPAN_HTML = `
<table>
  <tr>
    <td colspan="2" style="border: 1px solid black; width: 150px;">Merged cell spanning 2 columns</td>
  </tr>
  <tr>
    <td style="border: 1px solid black; width: 75px;">Cell A</td>
    <td style="border: 1px solid black; width: 75px;">Cell B</td>
  </tr>
</table>
`;

const TABLE_WITH_ROWSPAN_HTML = `
<table>
  <tr>
    <td rowspan="2" style="border: 1px solid black; width: 75px;">Merged cell spanning 2 rows</td>
    <td style="border: 1px solid black; width: 75px;">Cell A</td>
  </tr>
  <tr>
    <td style="border: 1px solid black; width: 75px;">Cell B</td>
  </tr>
</table>
`;

function findAllTableCells(node: LexicalNode): { colSpan: number; rowSpan: number; text: string }[] {
  const cells: { colSpan: number; rowSpan: number; text: string }[] = [];
  if ($isTableCellNode(node)) {
    cells.push({
      colSpan: node.getColSpan(),
      rowSpan: node.getRowSpan(),
      text: node.getTextContent().trim(),
    });
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      cells.push(...findAllTableCells(child));
    }
  }
  return cells;
}

async function loadHtmlIntoEditor(editor: LexicalEditor, html: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const dom = new JSDOM(html);
    const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document);
    const root = $getRoot();
    root.clear();
    root.append(...normalizeImportedTopLevelNodes(lexicalNodes));
  });
}

function syncLexicalToYjs(editor: LexicalEditor): Y.Doc {
  const ydoc = new Y.Doc();
  const docMap = new Map<string, Y.Doc>([["main", ydoc]]);
  const mockProvider = createMockProvider();
  const binding = createBinding(editor, mockProvider, "main", ydoc, docMap);

  // Sync the Lexical state to Yjs
  editor.getEditorState().read(() => {
    const root = $getRoot();
    binding.root.syncPropertiesFromLexical(binding, root, null);
    binding.root.syncChildrenFromLexical(binding, root, null, null, null);
  });

  return ydoc;
}

function syncYjsToNewEditor(ydoc: Y.Doc): LexicalEditor {
  return withDomGlobals(() => {
    const editor = createHeadlessEditor("yjsRoundtripTest");
    const docMap = new Map<string, Y.Doc>([["main", ydoc]]);
    const mockProvider = createMockProvider();
    const binding = createBinding(editor, mockProvider, "main", ydoc, docMap);

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();

        const xmlText: Y.XmlText = binding.root._xmlText;
        const delta = xmlText.toDelta();

        if (delta.length === 0) {
          return;
        }

        binding.root.applyChildrenYjsDelta(binding, delta);
        binding.root.syncChildrenFromYjs(binding);
      },
      { discrete: true },
    );

    return editor;
  });
}

/**
 * Creates a Yjs doc with a table where colSpan is stored WITHOUT the __ prefix,
 * simulating what an older version of Lexical/Yjs binding might have produced.
 */
function createYjsDocWithNonPrefixedColSpan(): Y.Doc {
  const ydoc = new Y.Doc();
  const rootXmlText = ydoc.get("root", Y.XmlText);

  ydoc.transact(() => {
    // Set root attributes
    rootXmlText.setAttribute("__type", "root");
    rootXmlText.setAttribute("__format", 0);
    rootXmlText.setAttribute("__style", "");
    rootXmlText.setAttribute("__indent", 0);
    rootXmlText.setAttribute("__dir", null as any);
    rootXmlText.setAttribute("__textFormat", 0);
    rootXmlText.setAttribute("__textStyle", "");

    // Create table
    const tableXmlText = new Y.XmlText();
    tableXmlText.setAttribute("__type", "table");
    tableXmlText.setAttribute("__format", 0);
    tableXmlText.setAttribute("__style", "");
    tableXmlText.setAttribute("__indent", 0);
    tableXmlText.setAttribute("__dir", null as any);
    tableXmlText.setAttribute("__textFormat", 0);
    tableXmlText.setAttribute("__textStyle", "");

    // Create row
    const rowXmlText = new Y.XmlText();
    rowXmlText.setAttribute("__type", "tablerow");
    rowXmlText.setAttribute("__format", 0);
    rowXmlText.setAttribute("__style", "");
    rowXmlText.setAttribute("__indent", 0);
    rowXmlText.setAttribute("__dir", null as any);
    rowXmlText.setAttribute("__textFormat", 0);
    rowXmlText.setAttribute("__textStyle", "");

    // Create table cell WITH colSpan stored without __ prefix (like older Lexical)
    const cellXmlText = new Y.XmlText();
    cellXmlText.setAttribute("__type", "tablecell");
    cellXmlText.setAttribute("__format", 0);
    cellXmlText.setAttribute("__style", "");
    cellXmlText.setAttribute("__indent", 0);
    cellXmlText.setAttribute("__dir", null as any);
    cellXmlText.setAttribute("__textFormat", 0);
    cellXmlText.setAttribute("__textStyle", "");
    // KEY: colSpan WITHOUT __ prefix
    cellXmlText.setAttribute("colSpan", 2);
    cellXmlText.setAttribute("rowSpan", 1);
    cellXmlText.setAttribute("__headerState", 0);
    cellXmlText.setAttribute("__width", 150);
    cellXmlText.setAttribute("__backgroundColor", null as any);

    // Create paragraph inside cell
    const paragraphXmlText = new Y.XmlText();
    paragraphXmlText.setAttribute("__type", "paragraph");
    paragraphXmlText.setAttribute("__format", 0);
    paragraphXmlText.setAttribute("__style", "");
    paragraphXmlText.setAttribute("__indent", 0);
    paragraphXmlText.setAttribute("__dir", null as any);
    paragraphXmlText.setAttribute("__textFormat", 0);
    paragraphXmlText.setAttribute("__textStyle", "");
    paragraphXmlText.insert(0, "Merged cell");

    cellXmlText.insertEmbed(0, paragraphXmlText);
    rowXmlText.insertEmbed(0, cellXmlText);
    tableXmlText.insertEmbed(0, rowXmlText);
    rootXmlText.insertEmbed(0, tableXmlText);
  });

  return ydoc;
}

describe("Yjs table cell span roundtrip", () => {
  it("handles colSpan stored WITHOUT __ prefix (legacy Yjs state)", async () => {
    // Create a Yjs doc where colSpan is stored as "colSpan" not "__colSpan"
    const ydoc = createYjsDocWithNonPrefixedColSpan();
    const editor = syncYjsToNewEditor(ydoc);

    let cells: ReturnType<typeof findAllTableCells> = [];
    editor.getEditorState().read(() => {
      cells = findAllTableCells($getRoot());
    });

    console.log("Legacy Yjs cells:", JSON.stringify(cells, null, 2));
    // When colSpan is stored without __ prefix, the raw sync doesn't set __colSpan.
    // All cells should have colSpan=1 (the default) because the sync sets
    // node.colSpan (own property) not node.__colSpan (internal).
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].colSpan).toBe(1);
  });

  it("yjsBinaryToHtml fixes colSpan stored WITHOUT __ prefix via $fixTableCellSpanProperties", () => {
    // Create the same legacy Yjs doc
    const ydoc = createYjsDocWithNonPrefixedColSpan();
    const binary = Y.encodeStateAsUpdate(ydoc);

    // yjsBinaryToHtml includes the $fixTableCellSpanProperties fix
    const html = yjsBinaryToHtml(binary);
    console.log("yjsBinaryToHtml output:", html);
    expect(html).toContain('colspan="2"');
  });


  it("preserves colSpan through Yjs roundtrip", async () => {
    // Step 1: Create editor with a table that has colspan
    const editor1 = createHeadlessEditor("colSpanTest-source");
    await loadHtmlIntoEditor(editor1, TABLE_WITH_COLSPAN_HTML);

    // Verify the source editor has correct colSpan
    let sourceCells: ReturnType<typeof findAllTableCells> = [];
    editor1.getEditorState().read(() => {
      sourceCells = findAllTableCells($getRoot());
    });

    console.log("Source editor cells:", JSON.stringify(sourceCells, null, 2));
    const mergedSourceCell = sourceCells.find(c => c.text.includes("Merged"));
    expect(mergedSourceCell).toBeDefined();
    expect(mergedSourceCell!.colSpan).toBe(2);

    // Step 2: Sync to Yjs
    const ydoc = syncLexicalToYjs(editor1);

    // Step 3: Inspect what's in the Yjs document
    const rootXmlText = ydoc.get("root", Y.XmlText);
    console.log("Yjs root attributes:", JSON.stringify(rootXmlText.getAttributes()));
    const delta = rootXmlText.toDelta();
    // Print condensed delta showing just the insert type and attributes
    const condensedDelta = delta.map((d: any) => ({
      type: typeof d.insert === 'string' ? 'text' : d.insert?.constructor?.name ?? 'unknown',
      attrs: d.attributes,
      ...(typeof d.insert === 'string' ? { text: d.insert.substring(0, 30) } : {}),
    }));
    console.log("Yjs delta (condensed):", JSON.stringify(condensedDelta, null, 2));

    // Walk the Yjs tree to find table cell XmlTexts and their attributes
    function inspectYjsTree(xmlText: Y.XmlText, path: string = "root") {
      const attrs = xmlText.getAttributes();
      if (Object.keys(attrs).length > 0) {
        console.log(`Yjs [${path}] attributes:`, JSON.stringify(attrs));
      }
      const childDelta = xmlText.toDelta();
      for (let i = 0; i < childDelta.length; i++) {
        const d = childDelta[i];
        if (d.insert instanceof Y.XmlText) {
          inspectYjsTree(d.insert, `${path}/${i}`);
        }
      }
    }
    inspectYjsTree(rootXmlText);

    // Step 4: Sync from Yjs to a new editor
    const editor2 = syncYjsToNewEditor(ydoc);

    // Step 5: Check colSpan in the new editor
    let destCells: ReturnType<typeof findAllTableCells> = [];
    editor2.getEditorState().read(() => {
      destCells = findAllTableCells($getRoot());
    });

    console.log("Dest editor cells:", JSON.stringify(destCells, null, 2));
    const mergedDestCell = destCells.find(c => c.text.includes("Merged"));
    expect(mergedDestCell).toBeDefined();
    expect(mergedDestCell!.colSpan).toBe(2);

    // Step 6: Check the HTML output
    let html = "";
    editor2.getEditorState().read(() => {
      html = withDomGlobals(() => $generateHtmlFromNodes(editor2, null));
    });

    console.log("Output HTML:", html);
    expect(html).toContain('colspan="2"');
  });

  it("preserves rowSpan through Yjs roundtrip", async () => {
    const editor1 = createHeadlessEditor("rowSpanTest-source");
    await loadHtmlIntoEditor(editor1, TABLE_WITH_ROWSPAN_HTML);

    let sourceCells: ReturnType<typeof findAllTableCells> = [];
    editor1.getEditorState().read(() => {
      sourceCells = findAllTableCells($getRoot());
    });

    console.log("Source editor cells (rowspan):", JSON.stringify(sourceCells, null, 2));
    const mergedSourceCell = sourceCells.find(c => c.text.includes("Merged"));
    expect(mergedSourceCell).toBeDefined();
    expect(mergedSourceCell!.rowSpan).toBe(2);

    const ydoc = syncLexicalToYjs(editor1);
    const editor2 = syncYjsToNewEditor(ydoc);

    let destCells: ReturnType<typeof findAllTableCells> = [];
    editor2.getEditorState().read(() => {
      destCells = findAllTableCells($getRoot());
    });

    console.log("Dest editor cells (rowspan):", JSON.stringify(destCells, null, 2));
    const mergedDestCell = destCells.find(c => c.text.includes("Merged"));
    expect(mergedDestCell).toBeDefined();
    expect(mergedDestCell!.rowSpan).toBe(2);

    let html = "";
    editor2.getEditorState().read(() => {
      html = withDomGlobals(() => $generateHtmlFromNodes(editor2, null));
    });

    console.log("Output HTML (rowspan):", html);
    expect(html).toContain('rowspan="2"');
  });
});
