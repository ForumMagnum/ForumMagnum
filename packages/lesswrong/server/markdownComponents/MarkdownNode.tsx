import { markdownClasses } from "../markdownApi/markdownResponse"

export function MarkdownNode({markdown, indentLevel = 0}: {
  markdown: string
  indentLevel?: number
}) {
  return (
    <div
      className={markdownClasses.markdown}
      data-markdown={markdown}
      data-indent-level={indentLevel}
    />
  );
}
