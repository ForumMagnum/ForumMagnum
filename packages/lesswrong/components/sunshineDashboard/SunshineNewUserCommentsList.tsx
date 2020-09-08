import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper'
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
  comments: any,
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { FormatDate, MetaInfo, SmallSideVote } = Components

  if (!comments) return null 

  const newComments = user.reviewedAt ? _filter(comments, comment => comment.postedAt > user.reviewedAt) : comments

  return (
    <div className={classes.root}>
      {newComments.map(comment=><div className={classes.comment} key={comment._id}>
        <Link to={Comments.getPageUrlFromIds({postId: comment.post?._id, postSlug: comment.post?.slug, tagSlug: comment.tag?.slug, commentId: comment._id})}>
          <MetaInfo>
            {comment.deleted && "[Deleted] "}Comment on '{comment.post?.title}'
          </MetaInfo>
          <span className={classes.meta}>
            <MetaInfo><FormatDate date={comment.postedAt}/></MetaInfo>
            <SmallSideVote document={comment} collection={Comments}/>
          </span>
        </Link>
        {comment.deleted && <div><MetaInfo>{`[Comment deleted${comment.deletedReason ? ` because "${comment.deletedReason}"` : ""}]`}</MetaInfo></div>}
        <div className={classes.commentStyle} dangerouslySetInnerHTML={{__html: (comment.contents && comment.contents.html) || ""}} />
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

