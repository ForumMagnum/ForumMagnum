import { Parser } from "htmlparser2";

// Chapter descriptions are edited as plain text and stored as simple HTML in
// the chapter's `contents` field: a <p> per blank-line-separated paragraph,
// and a <br> per single line break.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function plainTextToDescriptionHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${paragraph.split("\n").map((line) => escapeHtml(line.trim())).join("<br>")}</p>`)
    .join("");
}

const BLOCK_TAGS = new Set(["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"]);

export function descriptionHtmlToPlainText(html: string): string {
  const paragraphs: string[] = [];
  let current = "";
  const endParagraph = () => {
    if (current.trim()) {
      paragraphs.push(current.trim());
    }
    current = "";
  };

  const parser = new Parser({
    onopentag(name) {
      if (name === "br") {
        current += "\n";
      } else if (BLOCK_TAGS.has(name)) {
        endParagraph();
      }
    },
    ontext(text) {
      current += text.replace(/ /g, " ");
    },
    onclosetag(name) {
      if (BLOCK_TAGS.has(name)) {
        endParagraph();
      }
    },
  }, { decodeEntities: true });
  parser.write(html);
  parser.end();
  endParagraph();

  return paragraphs
    .map((paragraph) => paragraph.split("\n").map((line) => line.trim()).join("\n"))
    .join("\n\n");
}
