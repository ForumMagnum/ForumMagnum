import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper'

const styles = theme => ({
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

const SunshineNewUserCommentsList = ({terms, classes, truncated=false}: {
  terms: any,
  classes: ClassesType,
  truncated?: boolean,
}) => {
  const { results, loading } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
  });
  const { FormatDate, MetaInfo, Loading, SmallSideVote } = Components

  if (!results && loading && !truncated) return <Loading />
  if (!results) return null 
  return (
    <div className={classes.root}>
      {loading && !truncated && <Loading />}
      {results.map(comment=><div className={classes.comment} key={comment._id}>
        <Link to={Comments.getPageUrlFromIds({postId: comment.post?._id, postSlug: comment.post?.slug, tagSlug: comment.tag?.slug, commentId: comment._id})}>
          <MetaInfo>
            {comment.deleted && "[Deleted] "}Comment on '{comment.post?.title}'
          </MetaInfo>
          <span className={classes.meta}>
            <MetaInfo><FormatDate date={comment.postedAt}/></MetaInfo>
            <SmallSideVote document={comment} collection={Comments}/>
          </span>
        </Link>
        {!truncated && comment.deleted && <div><MetaInfo>`[Comment deleted${comment.deletedReason ? ` because "${comment.deletedReason}"` : ""}]</MetaInfo></div>}
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

