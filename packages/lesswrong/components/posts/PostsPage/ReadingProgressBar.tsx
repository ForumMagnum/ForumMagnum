import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { usePostReadProgress } from '../usePostReadProgress';
import { isBookUI } from '@/themes/forumTheme';
import { isServer } from '@/lib/executionEnvironment';

const styles = defineStyles("ReadingProgressBar", (theme: ThemeType) => ({
  readingProgressBar: {
    position: 'fixed',
    top: 0,
    height: 4,
    width: 'var(--scrollAmount)',
    background: theme.palette.primary.main,
    '--scrollAmount': '0%',
    zIndex: theme.zIndexes.commentBoxPopup,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8
    }
  },
}))

export const ReadingProgressBar = ({post}: {
  post: PostsListWithVotes
}) => {
  const disableProgressBar = (isBookUI() || isServer || post.isEvent || post.question || post.debate || post.shortform || post.readTimeMinutes < 3);

  const { readingProgressBarRef } = usePostReadProgress({
    updateProgressBar: (element, scrollPercent) => element.style.setProperty("--scrollAmount", `${scrollPercent}%`),
    disabled: disableProgressBar,
    useFixedToCScrollCalculation: false
  });
  
  const classes = useStyles(styles);
  return <div ref={readingProgressBarRef} className={classes.readingProgressBar}></div>
}
