import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components, withSingle } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts/collection'
import { QueryLink } from '../../../lib/reactRouterWrapper.js';


const styles = theme => ({
  version: {
    marginRight: theme.spacing.unit,
    fontWeight: 600,
  }
})

const PostsRevisionsList = ({document, loading, classes}) => {

  const { document, loading } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  const { FormatDate } = Components
  if (loading || !document) {return <MenuItem disabled> Loading... </MenuItem>} 
  const { revisions } = document
  return <React.Fragment>
    {revisions.map(({editedAt, version, user}) => 
    <MenuItem key={version} value={version}>
      <span className={classes.version}>v{version}</span> <FormatDate date={editedAt}/>
    </MenuItem>)}
  </React.Fragment>
}

const queryOptions = {
  queryName: `PostsRevisionsList`,
  collection: Posts,
  fetchPolicy: 'network-only', // Ensure that we load the list of revisions a new every time we click (this is useful after editing a post)
  fragmentName: 'PostsRevisionsList'
}


registerComponent('PostsRevisionsList', PostsRevisionsList, [withSingle, queryOptions], 
  withStyles(styles, {name: "PostsRevisionsList"})
)
