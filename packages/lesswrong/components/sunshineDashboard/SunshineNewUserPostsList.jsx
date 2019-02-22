import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles'
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from 'react-router'

const styles = theme => ({
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    ...postHighlightStyles(theme),
    fontSize: "1.1em"
  }
})

const SunshineNewUserPostsList = ({loading, results, classes}) => {
  const { PostsItemTitle, Loading } = Components
 
  if (!results && loading) return <Loading />
  if (!results) return null

  return (
    <div>
      {loading && <Loading />}
      {results.map(post=><div className={classes.post} key={post._id}>
        <Link to={`/posts/${post._id}`}>
          <PostsItemTitle post={post} />
        </Link>
        {!(post.status ==2) && `Flagged as Spam ${post.status}`}
        <div dangerouslySetInnerHTML={{__html: (post.contents && post.contents.htmlHighlight)}} />
      </div>)}
    </div>
  )
}

const withMultiOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
  enableCache: true
}

registerComponent( 'SunshineNewUserPostsList', SunshineNewUserPostsList, [withMulti, withMultiOptions], withStyles(styles, {name:"SunshineNewUserPostsList"}))
