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
// - [ ] Fix SSR issue

export const useDynamicTableOfContents = ({
  html,
  post,
  answers,
}: {
  html: string;
  post: PostWithCommentCounts & {question: boolean}
  answers: CommentsList[];
}): ToCData|null => {
  return useMemo(() => {
    const { document: htmlDoc, window: genericWindow } = parseDocumentFromString(html);

    const {
      sections = [],
      html: tocHtml = null,
    } = extractTableOfContents({ document: htmlDoc, window: genericWindow }) ?? {};

    const { commentCount } = getResponseCounts({ post, answers })
    const answerSections = getTocAnswers({post, answers})

    // TODO note behaviour change here, previously these would only be included if there were
    // headings in the post
    sections.push(...answerSections)

    // Always show the ToC for questions, to avoid layout shift when the answers load
    if (sections && (sections.length > MIN_HEADINGS_FOR_TOC || post.question)) {
      const commentsSection = [{ anchor: "comments", level: 0, title: postGetCommentCountStr(post, commentCount) }];
      sections?.push(...commentsSection)

      console.log({ sections });
      return {
        html: tocHtml ?? null,
        sections,
      }
    }

    return null;
  }, [answers, html, post]);
};
