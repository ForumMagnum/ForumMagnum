import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts/collection'
import { QueryLink } from '../../../lib/reactRouterWrapper.js';


const styles = theme => ({
  version: {
    marginRight: theme.spacing.unit,
    fontWeight: 600,
  }
})

const PostsRevisionsList = ({documentId, classes}) => {

  const { document, loading } = useSingle({
    queryName: `PostsRevisionsList`,
    collection: Posts,
    fetchPolicy: 'network-only', // Ensure that we load the list of revisions a new every time we click (this is useful after editing a post)
    fragmentName: 'PostsRevisionsList',
    documentId: documentId,
  });

  console.log("revisions document", document)

  const { FormatDate } = Components

  if (loading || !document) return <MenuItem disabled> Loading... </MenuItem>
  if (!loading && !document) return null 

  const { revisions } = document

  return <React.Fragment>
    {revisions.map(({editedAt, version, user}) => 
    <MenuItem key={version} value={version}>
      <span className={classes.version}>v{version}</span> <FormatDate date={editedAt}/>
    </MenuItem>)}
  </React.Fragment>
}

registerComponent('PostsRevisionsList', PostsRevisionsList, 
  withStyles(styles, {name: "PostsRevisionsList"})
)
