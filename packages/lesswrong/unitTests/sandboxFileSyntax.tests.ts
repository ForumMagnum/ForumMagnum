import { highlightFile } from "@/components/research/sandboxFileSyntax";

describe("highlightFile", () => {
  it("highlights a known extension into Prism token markup", () => {
    const result = highlightFile("/vercel/sandbox/app.py", "def f():\n    return 1\n");
    expect(result.language).toBe("python");
    expect(result.html).toContain('class="token keyword"');
  });

  it("maps compound TS/JS extensions", () => {
    expect(highlightFile("a.tsx", "const x = <div/>;").language).toBe("tsx");
    expect(highlightFile("a.mjs", "export const x = 1;").language).toBe("javascript");
  });

  it("resolves language from special filenames without an extension", () => {
    expect(highlightFile("/x/Dockerfile", "FROM node:20").language).toBe("docker");
  });

  it("returns null html for unknown extensions (plain-text fallback)", () => {
    const result = highlightFile("notes.xyz", "hello world");
    expect(result.language).toBeNull();
    expect(result.html).toBeNull();
  });

  it("escapes the file text in its output (no raw injection)", () => {
    const result = highlightFile("x.json", '{"a": "<script>"}');
    expect(result.html).not.toBeNull();
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script");
  });
});
