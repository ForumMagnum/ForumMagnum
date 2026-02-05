import { markdownClasses } from "../markdownApi/markdownResponse"

export function MarkdownNode({markdown}: {
  markdown: string
}) {
  return <div className={markdownClasses.markdown} data-markdown={markdown}></div>
}
