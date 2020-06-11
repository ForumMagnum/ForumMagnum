import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper'

const styles = theme => ({
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    ...postHighlightStyles(theme),
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  }
})

const SunshineNewUserPostsList = ({terms, classes, truncated=false}: {
  terms: any,
  classes: ClassesType,
  truncated?: boolean,
}) => {
  const { results, loading } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
  });
  const { Loading, MetaInfo } = Components
 
  if (!results && loading && !truncated) return <Loading />
  if (!results) return null

  return (
    <div>
      {loading && !truncated && <Loading />}
      {results.map(post=><div className={classes.post} key={post._id}>
        <MetaInfo>
          <Link to={`/posts/${post._id}`}>
            {(post.status !==2) && `[Spam] ${post.status}`}
            Post: {post.title} ({post.baseScore} karma)
          </Link>
        </MetaInfo>
        <div className={classes.postBody} dangerouslySetInnerHTML={{__html: (post.contents && post.contents.htmlHighlight)}} />
      </div>)}
    </div>
  )
}

const SunshineNewUserPostsListComponent = registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserPostsList: typeof SunshineNewUserPostsListComponent
  }
}

