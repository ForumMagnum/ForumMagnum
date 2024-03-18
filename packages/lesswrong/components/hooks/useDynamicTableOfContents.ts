import { useMemo } from "react";
import { MIN_HEADINGS_FOR_TOC, ToCData, extractTableOfContents, getTocAnswers } from "../../lib/tableOfContents";
import { PostWithCommentCounts, getResponseCounts, postGetCommentCountStr } from "../../lib/collections/posts/helpers";
import { parseDocumentFromString } from "../../lib/domParser";

// Comment/answer count notes:
// Currently:
// - Answers don't need a count, just the list of answers, which we have on the client already (and in fact this saves a lot of db time)
// - Comments only need a count
//   - On the server, this is calculated directly with a count query that (which will always be correct)
//   - On the client, this (the number at the top of the page) is calculated from the cached commentCount field, minus the number of answers.
//     This number of answers is also calculated in a slightly roundabout way, in that it uses countAnswersAndDescendents to include replies
//     to these answers

// TODO:
// - [X] Move getResponseCounts function out to lib somewhere post helpers
// - [X] Use this for the comment counts
// - [X] Use the answers directly for the answer sections
// - [X] See if I can remove headingsCount
// - [X] Fix SSR issue

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
