import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useCommentLink, UseCommentLinkProps } from './useCommentLink';
import { isEAForum } from '../../../lib/instanceSettings';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: isEAForum ? 7 : undefined,
    "& a:hover, & a:active": {
      "& $icon": {
        color: `${theme.palette.icon.dim5} !important`,
      },
    },

    // Create a stacking context and set z-index to be higher than the vote
    // buttons, which are to the right of this and have a click-target that
    // partially overlaps.
    position: "relative",

    // Prevent permalink-icon and date from wrapping onto separate lines, in
    // narrow/flexbox contexts
    whiteSpace: "nowrap",

    zIndex: theme.zIndexes.commentPermalinkIcon,
  },
  answerDate: {},
  date: {
    color: theme.palette.text.dim,
  },
  postTitle: {
    marginRight: 5,
  },
  link: {
  },
  icon: {
    fontSize: "0.9rem",
    verticalAlign: "middle",
    color: theme.palette.icon.dim,
    margin: "0 2px",
    position: "relative",
    top: -2,
  },
});

type CommentsItemDateProps = UseCommentLinkProps & {classes: ClassesType};

const CommentsItemDate = ({comment, classes, ...rest}: CommentsItemDateProps) => {
  const LinkWrapper = useCommentLink({comment, ...rest});
  return (
    <span className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      <LinkWrapper>
        <Components.FormatDate
          date={comment.postedAt}
          format={comment.answer ? "MMM DD, YYYY" : undefined}
        />
        {!isEAForum && <Components.ForumIcon icon="Link" className={classes.icon} />}
      </LinkWrapper>
    </span>
  );
}

const CommentsItemDateComponent = registerComponent(
  'CommentsItemDate', CommentsItemDate, {styles}
);

declare global {
  interface ComponentTypes {
    CommentsItemDate: typeof CommentsItemDateComponent,
  }
}

