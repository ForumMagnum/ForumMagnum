import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'
import { useCurrentUser } from '../../common/withUser'
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import type { ContentStyleType } from '../../common/ContentStyles';
import { RejectedReasonDisplay } from '../../sunshineDashboard/RejectedReasonDisplay';

const styles = (theme: ThemeType): JssStyles => ({
  commentStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
  },
  answerStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
    '& .read-more-button a, & .read-more-button a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    },
    marginBottom: ".5em"
  },
  root: {
    position: "relative",
    '& .read-more-button': {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    }
  },
  retracted: {
    textDecoration: "line-through",
  },
})

const CommentBody = ({ comment, classes, collapsed, truncated, postPage }: {
  comment: CommentsList,
  collapsed?: boolean,
  truncated?: boolean,
  postPage?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { ContentItemBody, CommentDeletedMetadata, ContentStyles, RejectedReasonDisplay } = Components
  const { html = "" } = comment.contents || {}

  const bodyClasses = classNames(
    { [classes.commentStyling]: !comment.answer,
      [classes.answerStyling]: comment.answer,
      [classes.retracted]: comment.retracted }
  );

  if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
  if (collapsed) { return null }

  const innerHtml = truncated ? commentExcerptFromHTML(comment, currentUser, postPage) : html

  let contentType: ContentStyleType;
  if (comment.answer) {
    contentType = 'answer';
  } else if (comment.debateResponse) {
    contentType = 'debateResponse';
  } else {
    contentType = 'comment';
  }

  return (
    <ContentStyles contentType={contentType} className={classes.root}>
      {comment.rejected && <p><RejectedReasonDisplay reason={comment.rejectedReason}/></p>}
      <ContentItemBody
        className={bodyClasses}
        dangerouslySetInnerHTML={{__html: innerHtml }}
        description={`comment ${comment._id}`}
        nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
      />
    </ContentStyles>
  )
}

const CommentBodyComponent = registerComponent('CommentBody', CommentBody, {styles});

declare global {
  interface ComponentTypes {
    CommentBody: typeof CommentBodyComponent,
  }
}

