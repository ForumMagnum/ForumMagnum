import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { commentBodyStyles } from '../../themes/stylePiping'
import _filter from 'lodash/filter';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: theme.spacing.unit
  },
  comment: {
    marginTop: 4,
    marginBottom: 4,
    color: "rgba(0,0,0,.7)",
    border: "solid 1px rgba(0,0,0,.15)",
    marginLeft: -12,
    marginRight: -12,
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8
  },
  commentStyle: {
    ...commentBodyStyles(theme),
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
