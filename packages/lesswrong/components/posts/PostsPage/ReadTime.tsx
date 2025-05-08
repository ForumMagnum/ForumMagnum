import React, { useMemo } from 'react';
import { isFriendlyUI } from '@/themes/forumTheme';
import { Components, registerComponent } from "@/lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    cursor: 'default',
    "@media print": { display: "none" },
  },
});

export const ReadTimeInner = ({classes, post, dialogueResponses}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  dialogueResponses: CommentsList[],
}) => {
  const { LWTooltip } = Components
  const wordCount = useMemo(() => {
    if (!post.debate || dialogueResponses.length === 0) {
      return post.contents?.wordCount || 0;
    }

    return dialogueResponses.reduce((wordCount, response) => {
      wordCount += response.contents?.wordCount ?? 0;
      return wordCount;
    }, 0);
  }, [post, dialogueResponses]);

  /**
   * It doesn't make a ton of sense to fetch all the debate response comments in the resolver field, since we:
   * 1. already have them here
   * 2. need them to compute the word count in the debate case as well
   */
  const readTime = useMemo(() => {
    if (!post.debate || dialogueResponses.length === 0) {
      return post.readTimeMinutes ?? 1;
    }

    return Math.max(1, Math.round(wordCount / 250));
  }, [post, dialogueResponses, wordCount]);

  return <LWTooltip title={`${wordCount} words`}>
        <span className={classes.root}>{readTime} min read</span>
      </LWTooltip>
}

export const ReadTime = registerComponent('ReadTime', ReadTimeInner, {styles});

declare global {
  interface ComponentTypes {
    ReadTime: typeof ReadTime
  }
}
