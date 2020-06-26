import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper'

const styles = theme => ({
  comment: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    color: "rgba(0,0,0,.7)"
  },
  commentStyle: {
    ...commentBodyStyles(theme),
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
    fragmentName: 'CommentsListWithPostMetadata',
    fetchPolicy: 'cache-and-network',
  });
  const { FormatDate, MetaInfo, Loading } = Components

  if (!results && loading && !truncated) return <Loading />
  if (!results) return null 
  return (
    <div>
      {loading && !truncated && <Loading />}
      {results.map(comment=><div className={classes.comment} key={comment._id}>
        <MetaInfo>
          <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
            {comment.deleted && "[Deleted] "}Comment on '{comment.post.title}' (<FormatDate date={comment.postedAt}/>, {comment.baseScore} karma)
          </Link>
        </MetaInfo>
        {!truncated && <div><MetaInfo>{comment.deleted && `[Comment deleted${comment.deletedReason ? ` because "${comment.deletedReason}"` : ""}]`}</MetaInfo></div>}
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

