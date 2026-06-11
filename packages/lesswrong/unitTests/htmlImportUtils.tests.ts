import { flattenNestedCodeBlocks } from "@/lib/editor/htmlImportUtils";
import { JSDOM } from "jsdom";

describe("flattenNestedCodeBlocks", () => {
  it("turns nested code blocks into literal text", () => {
    const dom = new JSDOM(`
      <body>
        <pre class="code-block">outer
          <code class="code-block"><span>inner</span></code>
          after
        </pre>
      </body>
    `);

    flattenNestedCodeBlocks(dom.window.document.body);

    expect(dom.window.document.body.querySelectorAll('.code-block')).toHaveLength(1);
    expect(dom.window.document.body.textContent).toContain('outer');
    expect(dom.window.document.body.textContent).toContain('inner');
    expect(dom.window.document.body.textContent).toContain('after');
  });

  it("preserves ordinary inline highlighting inside code blocks", () => {
    const dom = new JSDOM(`
      <body>
        <pre class="code-block"><span class="code-token-keyword">const</span> x = 1;</pre>
      </body>
    `);

    flattenNestedCodeBlocks(dom.window.document.body);

    expect(dom.window.document.body.querySelectorAll('.code-block')).toHaveLength(1);
    expect(dom.window.document.body.querySelector('.code-token-keyword')?.textContent).toBe('const');
  });
});
