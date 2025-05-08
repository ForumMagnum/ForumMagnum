import React, { FC, MouseEvent } from 'react';
import classNames from 'classnames';
import { HOVER_CLASSNAME } from './MultiToCLayout';
import { CommentsLink } from '../PostsPage/PostsPagePostHeader';
import { registerComponent } from "@/lib/vulcan-lib/components";
import { ForumIcon } from "../../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    color: theme.palette.text.dim3,
  },
  comments: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    display: "flex",
    alignItems: "center",
    marginRight: 16,
  },
  commentsIcon: {
    fontSize: 20,
    marginRight: 8,
    color: theme.palette.grey[500],
    position: 'relative',
    top: 1
  },
  '@font-face': {
    fontFamily: "ETBookBold",
    src: "url('https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1504470690/et-book-bold-line-figures_piiabg.woff') format('woff')",  
  },
  answerIcon: {
    fontSize: 24,
    fontFamily: "ETBookBold",
    fontWeight: 900,
    marginRight: 7,
    color: theme.palette.text.dim3,
  },
  commentsLabel: {
    marginLeft: 6
  },
  wideClickTarget: {
    width: '100%',
  },
  rowOpacity: {
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  }
});

export const LWCommentCountInner = ({classes, answerCount, commentCount, label=true}: {
  classes: ClassesType<typeof styles>,
  answerCount?: number,
  commentCount?: number,
  label?: boolean,
}) => {
  return <div className={classes.root}>
        {typeof answerCount === 'number' && <CommentsLink anchor="#answers" className={classes.comments}>
          <div className={classes.answerIcon}>A</div>
          {answerCount}
        </CommentsLink>}
        <CommentsLink anchor="#comments" className={classNames(classes.comments, classes.wideClickTarget)}>
          <ForumIcon icon="Comment" className={classes.commentsIcon} />
          {commentCount}
          {typeof answerCount !== 'number' && label && <span className={classNames(classes.commentsLabel, HOVER_CLASSNAME, classes.rowOpacity)}>Comments</span>}
        </CommentsLink>
      </div>
}

export const LWCommentCount = registerComponent('LWCommentCount', LWCommentCountInner, {styles});

declare global {
  interface ComponentTypes {
    LWCommentCount: typeof LWCommentCount
  }
}
