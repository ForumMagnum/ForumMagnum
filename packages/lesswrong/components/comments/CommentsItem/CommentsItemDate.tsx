import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCommentLink, UseCommentLinkProps } from './useCommentLink';
import classNames from 'classnames';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { isLWorAF } from '../../../lib/instanceSettings';
import DeferRender from '@/components/common/DeferRender';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import FormatDate, { ExpandedDate } from '@/components/common/FormatDate';
import LWTooltip from "../../common/LWTooltip";

// The amount of time during which you can edit a comment, without it causing
// the comment to be marked as edited.
const EDIT_GRACE_PERIOD = 60*60*1000; //1hr

const styles = defineStyles("CommentsItemDate", (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI ? {
      marginLeft: 2,
      marginRight: 7,
    } : {
      marginLeft: 2,
      marginRight: 16,
    }),

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
  editedMarker: {
    paddingLeft: 2,
    fontSize: 12,
  },
}));

type CommentsItemDateProps = UseCommentLinkProps & {
  comment: CommentsList,
  preventDateFormatting?: boolean,
  className?: string,
};

const CommentsItemDate = ({comment, preventDateFormatting, className, ...rest}: CommentsItemDateProps) => {
  const classes = useStyles(styles);
  
  const LinkWrapper = useCommentLink({comment, ...rest});
  
  let dateFormat: string | undefined;
  if (preventDateFormatting) {
    dateFormat = undefined;
  } else if (comment.answer) {
    dateFormat = "MMM DD, YYYY";
  } else if (comment.debateResponse) {
    dateFormat = "h:mm a";
  } else {
    dateFormat = undefined;
  }

  const linkContents = (<LWTooltip
    title={<CommentDateTooltip comment={comment}/>}
  >
    <FormatDate
      date={comment.postedAt}
      format={dateFormat}
      tooltip={false}
    />
    {markCommentAsEdited(comment) && <span className={classes.editedMarker}>{"*"}</span>}
  </LWTooltip>);
  
  return (
    <span className={classNames(
      classes.root,
      !comment.answer && classes.date,
      comment.answer && classes.answerDate,
      className,
    )}>
      <DeferRender ssr={!isLWorAF} fallback={linkContents}>
        <LinkWrapper>
          {linkContents}
        </LinkWrapper>
      </DeferRender>
    </span>
  );
}

const markCommentAsEdited = (comment: CommentsList): boolean => {
  if (!comment.lastEditedAt) return false;
  const timeBetweenPostingAndEditingMs = new Date(comment.lastEditedAt).getTime() - new Date(comment.postedAt).getTime();
  return (timeBetweenPostingAndEditingMs > EDIT_GRACE_PERIOD);
}

const CommentDateTooltip = ({comment}: {
  comment: CommentsList
}) => {
  if (markCommentAsEdited(comment) && comment.lastEditedAt) {
    return <>
      <div>Posted <ExpandedDate date={comment.postedAt} /></div>
      <div>Last edited <ExpandedDate date={comment.lastEditedAt} /></div>
    </>
  } else {
    return <ExpandedDate date={comment.postedAt} />
  }
}

export default registerComponent('CommentsItemDate', CommentsItemDate);



