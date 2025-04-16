import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { isLWorAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: theme.spacing.unit,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  comment: {
    marginBottom: 16,
    marginTop: 16,
  },
  meta: {
    display: "inline-block"
  },
  rejection: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 2
  }
})

const SunshineNewUserCommentsList = ({comments, user, classes}: {
  comments?: Array<CommentsListWithParentMetadata>,
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const { CommentsNode, RejectContentButton, RejectedReasonDisplay } = Components

  if (!comments) return null 

  const newComments = user.reviewedAt ? comments.filter(comment => comment.postedAt > user.reviewedAt!) : comments

  return (
    <div className={classes.root}>
      {(newComments.length > 0) && newComments.map(comment=><div className={classes.comment} key={`sunshine-new-user-${comment._id}`}>
        {isLWorAF && <div className={classes.rejection}>
          {comment.rejected && <RejectedReasonDisplay reason={comment.rejectedReason}/>}
          <RejectContentButton contentWrapper={{collectionName:"Comments", content:comment}}/>
        </div>}
        <CommentsNode 
          treeOptions={{
            condensed: false,
            post: comment.post || undefined,
            showPostTitle: true,
          }}
          forceUnTruncated
          forceUnCollapsed
          comment={comment}
        />
      </div>)}
    </div>
  )
}

const SunshineNewUserCommentsListComponent = registerComponent('SunshineNewUserCommentsList', SunshineNewUserCommentsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserCommentsList: typeof SunshineNewUserCommentsListComponent
  }
}
