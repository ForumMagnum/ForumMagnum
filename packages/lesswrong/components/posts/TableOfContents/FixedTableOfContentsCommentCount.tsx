import React, { FC, MouseEvent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { Components } from '@/lib/vulcan-lib/components';
import classNames from 'classnames';
import { FIXED_TOC_COMMENT_COUNT_HEIGHT, HOVER_CLASSNAME } from './MultiToCLayout';

const styles = (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    paddingLeft: 12,
    paddingTop: 12,
    paddingBottom: 20,
    height: FIXED_TOC_COMMENT_COUNT_HEIGHT,
    bottom: 0,
    left: 0,
    width: 240,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1000,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    '&:hover $commentsLabel': {
      opacity: 1
    }
  },
  comments: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.link.tocLink,
    display: "flex",
    alignItems: "center",
    marginRight: 16,
  },
  commentsIcon: {
    fontSize: 20,
    marginRight: 8,
    color: theme.palette.grey[400],
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
    color: theme.palette.grey[400]
  },
  commentsLabel: {
    marginLeft: 6
  },
  wideClickTarget: {
    width: '100%',
  },
  rowOpacity: {
    opacity: 0
  }
});

const CommentsLink: FC<{
  anchor: string,
  children: React.ReactNode,
  className?: string,
}> = ({anchor, children, className}) => {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.querySelector("#comments");
    if (elem) {
      // Match the scroll behaviour from TableOfContentsList
      window.scrollTo({
        top: window.scrollY + elem.getBoundingClientRect().top,
        behavior: "smooth",
      });
    } 
  }
  return (
    <a className={className} href={anchor} onClick={onClick}>
      {children}
    </a>
  );
}

export const FixedTableOfContentsCommentCount = ({classes, answerCount, commentCount}: {
  classes: ClassesType<typeof styles>,
  answerCount?: number,
  commentCount?: number,
}) => {
  const { Row, ForumIcon } = Components;
  return <div className={classes.root}>
      <Row justifyContent="flex-start">
        {typeof answerCount === 'number' && <CommentsLink anchor="#answers" className={classes.comments}>
          <div className={classes.answerIcon}>A</div>
          {answerCount}
        </CommentsLink>}
        <CommentsLink anchor="#comments" className={classNames(classes.comments, classes.wideClickTarget)}>
          <ForumIcon icon="Comment" className={classes.commentsIcon} />
          {commentCount}
          {typeof answerCount !== 'number'  && <span className={classNames(classes.commentsLabel, HOVER_CLASSNAME, classes.rowOpacity)}>Comments</span>}
        </CommentsLink>
      </Row>
    </div>
}

const FixedTableOfContentsCommentCountComponent = registerComponent('FixedTableOfContentsCommentCount', FixedTableOfContentsCommentCount, {styles});

declare global {
  interface ComponentTypes {
    FixedTableOfContentsCommentCount: typeof FixedTableOfContentsCommentCountComponent
  }
}
