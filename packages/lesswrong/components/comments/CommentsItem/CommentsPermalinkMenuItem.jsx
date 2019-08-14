import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import LinkIcon from '@material-ui/icons/Link';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { Link } from '../../../lib/reactRouterWrapper.js';
import { Comments } from "../../../lib/collections/comments";

const CommentsPermalinkMenuItem = ({comment, post}) => {
  return <Link to={Comments.getPageUrlFromIds({postId: post._id, postSlug: post.slug, commentId: comment._id})}>
    <MenuItem onClick={this.showReport}>
      <ListItemIcon>
        <LinkIcon />
      </ListItemIcon>
      Go to Permalink
    </MenuItem>
  </Link>
}

registerComponent('CommentsPermalinkMenuItem', CommentsPermalinkMenuItem);
