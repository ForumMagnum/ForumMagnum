import { useMemo } from "react"
import { extractTableOfContents } from "../../lib/tableOfContents"
import { DOMWindow } from "jsdom"


export const useDynamicTableOfContents = ({
  html,
  answers,
  comments,
}: {
  html: string;
  answers: CommentsList[];
  comments: CommentsList[];
}) => {
  return useMemo(() => {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, "text/html");

    return extractTableOfContents({ document: htmlDoc, window: window as DOMWindow });
  }, [html]);
};
