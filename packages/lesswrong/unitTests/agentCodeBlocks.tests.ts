import { $generateHtmlFromNodes } from "@lexical/html";
import { $isCodeNode } from "@lexical/code";
import { $getRoot } from "lexical";
import { agentMarkdownFromEditorHtml } from "../../../app/api/agent/agentMarkdownView";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { $researchMarkdownToNodes } from "../../../app/api/research/agent/documents/insertBlock/insertMarkdownBlockInResearchDoc";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { runEditorUpdate, walkLexicalNodes } from "./lexicalTestHelpers";

describe("agent code block round trips", () => {
  it("imports a fenced research code block as one code node and fetches it as a fence", async () => {
    const markdown = [
      "CODETEST-MARKER",
      "",
      "```ts",
      "const a = 1;",
      "const b: string = \"x\";",
      "```",
    ].join("\n");
    const editor = createHeadlessEditor("AgentCodeBlockRoundTripTest");

    await runEditorUpdate(editor, () => {
      const root = $getRoot();
      root.clear();
      root.append(...$researchMarkdownToNodes(editor, markdown));
    });

    let codeBlockCount = 0;
    let html = "";
    editor.getEditorState().read(() => {
      walkLexicalNodes($getRoot(), (node) => {
        if ($isCodeNode(node)) {
          codeBlockCount++;
        }
      });
      html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
    });

    expect(codeBlockCount).toBe(1);
    expect(agentMarkdownFromEditorHtml(html)).toBe(markdown);
  });
});
