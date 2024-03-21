import { useMemo } from "react";
import { MIN_HEADINGS_FOR_TOC, ToCData, extractTableOfContents, getTocAnswers } from "../../lib/tableOfContents";
import { PostWithCommentCounts, getResponseCounts, postGetCommentCountStr } from "../../lib/collections/posts/helpers";
import { parseDocumentFromString } from "../../lib/domParser";

type PostMinForToc = PostWithCommentCounts & {
  question: boolean;
  tableOfContentsRevision?: ToCData;
  tableOfContents?: ToCData;
};

export const useDynamicTableOfContents = ({
  html,
  post,
  answers,
}: {
  html: string | null;
  post: PostMinForToc | null;
  answers: CommentsList[];
}): ToCData | null => {
  return useMemo(() => {
    const precalcuatedToc = post?.tableOfContentsRevision ?? post?.tableOfContents;
    if (precalcuatedToc) {
      return precalcuatedToc;
    }

    if (!html) {
      return {
        html,
        sections: []
      }
    }

    const { sections = [], html: tocHtml = null } =
      extractTableOfContents(parseDocumentFromString(html)) ?? {};

    // Always show the ToC for questions, to avoid layout shift when the answers load
    if (sections.length > MIN_HEADINGS_FOR_TOC || post?.question) {
      if (!post) {
        return {
          html: tocHtml ?? null,
          sections,
        };
      }

      const answerSections = getTocAnswers({ post, answers });
      sections.push(...answerSections);

      const { commentCount } = getResponseCounts({ post, answers });
      const commentsSection = [{ anchor: "comments", level: 0, title: postGetCommentCountStr(post, commentCount) }];
      sections.push(...commentsSection);

      return {
        html: tocHtml ?? null,
        sections,
      };
    }

    return null;
  }, [answers, html, post]);
};
