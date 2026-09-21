import { useForumType } from '@/components/hooks/useForumType';
import { useMemo } from "react";
import { ToCData, extractTableOfContents, getTocAnswers, getTocComments } from "../../lib/tableOfContents";
import { PostWithCommentCounts, getResponseCounts } from "../../lib/collections/posts/helpers";
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
  const { forumType } = useForumType();
  return useMemo(() => {
    const precalcuatedToc = post?.tableOfContentsRevision ?? post?.tableOfContents;
    if (precalcuatedToc) {
      return precalcuatedToc;
    }

    const { sections = [], html: tocHtml = null } =
      extractTableOfContents(parseDocumentFromString(html ?? '')) ?? {};

    if (!post) {
      return {
        html: tocHtml ?? null,
        sections,
      };
    }

    const answerSections = getTocAnswers({ post, answers });
    sections.push(...answerSections);

    const { commentCount } = getResponseCounts({ post, answers, forumType });
    const commentsSection = getTocComments({ post, commentCount, forumType });
    sections.push(...commentsSection);

    return {
      html: tocHtml ?? null,
      sections,
    };
  }, [answers, html, post, forumType]);
};
