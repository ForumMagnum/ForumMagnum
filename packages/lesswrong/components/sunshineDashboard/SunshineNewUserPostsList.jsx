import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles'
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper.js'

const styles = theme => ({
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    ...postHighlightStyles(theme),
  }
})

const SunshineNewUserPostsList = ({loading, results, classes, truncated}) => {
  const { Loading, MetaInfo } = Components
 
  if (!results && loading && !truncated) return <Loading />
  if (!results) return null

  return (
    <div>
      {loading && !truncated && <Loading />}
      {results.map(post=><div className={classes.post} key={post._id}>
        <MetaInfo>
          <Link to={`/posts/${post._id}`}>
            Post: {post.title}
          </Link>
        </MetaInfo>
        <div className={classes.postBody} dangerouslySetInnerHTML={{__html: (post.contents && post.contents.htmlHighlight)}} />
        {!(post.status ==2) && `Flagged as Spam ${post.status}`}
      </div>)}
    </div>
  )
}

const withMultiOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
  enableCache: true,
  fetchPolicy: 'cache-and-network',
}

registerComponent( 'SunshineNewUserPostsList', SunshineNewUserPostsList, [withMulti, withMultiOptions], withStyles(styles, {name:"SunshineNewUserPostsList"}))
