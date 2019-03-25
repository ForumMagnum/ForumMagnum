import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  display: "block",
  marginLeft: 30,
  
  itemBox: {
    "&:hover $remove": {
      opacity: 1,
    },
  },
  title: {
    display: "inline",
    marginRight: 10,
    fontSize: 20,
    lineHeight: 1.25,
  },
  meta: {
    display: "inline-block",
    color: "rgba(0,0,0,0.5)",
    "& div": {
      display: "inline-block",
      marginRight: 5,
    }
  },
  remove: {
    opacity: 0,
    position: "absolute",
    right: 0,
    cursor: "pointer"
  },
  removeIcon: {
    color: "rgba(0,0,0,0.3) !important"
  },
});

const PostsItemWrapper = ({document, loading, classes, ...props}) => {
  if (document && !loading) {
    return <div>
      <DragIcon className="drag-handle"/>
      <div className={classes.itemBox}>
        <div className={classes.title}>
          {document.title}
        </div>
        <div className={classes.meta}>
          <div className="posts-list-edit-item-author">
            {document.user.displayName}
          </div>
          <div className="posts-list-edit-item-karma">
            {document.baseScore} points
          </div>
          <div className="posts-list-edit-item-comments">
            {document.commentCount} comments
          </div>
          <div className={classes.remove}>
            <RemoveIcon className={classes.removeIcon} onClick={() => props.removeItem(document._id)} />
          </div>
        </div>
      </div>
    </div>
  } else {
    return <Components.Loading />
  }
};

const options = {
  collection: Posts,
  queryName: "PostsItemWrapperQuery",
  fragmentName: 'PostsList',
  enableTotal: false,
};

registerComponent('PostsItemWrapper', PostsItemWrapper,
  [withDocument, options],
  withStyles(styles, {name: "PostsItemWrapper"}));
