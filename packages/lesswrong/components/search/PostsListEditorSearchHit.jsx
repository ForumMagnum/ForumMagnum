import React from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper.js';

import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';

const styles = theme => ({
    root: {
      padding: theme.spacing.unit,
      borderBottom: "solid 1px",
      borderBottomColor: grey[200],
      '&:hover': {
        backgroundColor: grey[100],
      }
    },
    postLink: {
      float:"right",
      marginRight: theme.spacing.unit
    }
  })

const PostsListEditorSearchHit = ({hit, clickAction, classes}) => {
  // If clickAction is provided, disable link and replace with Click of the action
  return (
    <div className={classes.root}>
      <div>
        <Components.PostsTitle post={hit} />
      </div>
      {hit.authorDisplayName && <Components.MetaInfo>
        {hit.authorDisplayName}
      </Components.MetaInfo>}
      <Components.MetaInfo>
        {hit.baseScore} points
      </Components.MetaInfo>
      {hit.postedAt && <Components.MetaInfo>
        <Components.FormatDate date={hit.postedAt}/>
      </Components.MetaInfo>}
      <Link to={Posts.getLink(hit)} target={Posts.getLinkTarget(hit)} className={classes.postLink}>
        (Link)
      </Link>
    </div>
  )
}


registerComponent("PostsListEditorSearchHit", PostsListEditorSearchHit, withStyles(styles, { name: "PostsListEditorSearchHit" }));
