import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import _filter from 'lodash/filter';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: theme.spacing.unit,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  comment: {
    marginTop: 4,
    marginBottom: 4,
    color: theme.palette.text.slightlyDim2,
    border: theme.palette.border.slightlyFaint,
    marginLeft: -12,
    marginRight: -12,
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8
  },
  meta: {
    display: "inline-block"
  }
})

const SunshineNewUserCommentsList = ({comments, user, classes}: {
  comments?: Array<CommentsListWithParentMetadata>,
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { CommentsNode } = Components

  if (!comments) return null 

  const newComments = user.reviewedAt ? _filter(comments, comment => comment.postedAt > user.reviewedAt) : comments

  return (
    <div className={classes.root}>
      {(newComments.length > 0) && newComments.map(comment=><CommentsNode 
              key={`sunshine-new-user-${comment._id}`}
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                showPostTitle: true,
              }}
              expandByDefault
              comment={comment}
            />)}
    </div>
  )
}

const SunshineNewUserCommentsListComponent = registerComponent('SunshineNewUserCommentsList', SunshineNewUserCommentsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserCommentsList: typeof SunshineNewUserCommentsListComponent
  }
}
