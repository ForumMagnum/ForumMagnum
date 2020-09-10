import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper'

const styles = (theme: ThemeType): JssStyles => ({
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    ...postHighlightStyles(theme),
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  meta: {
    display: 'inline-block'
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
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
  });
  const { Loading, MetaInfo, FormatDate, PostsTitle, SmallSideVote } = Components
 
  if (!results && loading && !truncated) return <Loading />
  if (!results) return null

  return (
    <div>
      {loading && !truncated && <Loading />}
      {results.map(post=><div className={classes.post} key={post._id}>
        <div>
          <Link to={`/posts/${post._id}`}>
            <PostsTitle post={post} showIcons={false} wrap/> 
            {(post.status !==2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
          </Link>
          <span className={classes.meta}>
            <MetaInfo><FormatDate date={post.postedAt}/> </MetaInfo>
            <SmallSideVote document={post} collection={Posts}/>
          </span>
        </div>
        <div className={classes.postBody} dangerouslySetInnerHTML={{__html: (post.contents?.htmlHighlight || "")}} />
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

