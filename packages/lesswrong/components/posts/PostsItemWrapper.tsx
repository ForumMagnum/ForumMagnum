import { Components, registerComponent } from 'meteor/vulcan:core';
import { withSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    '&:hover': {
      '& $removeIcon': {
        opacity: 1,
      }
    }
  },
  title: {
    maxWidth: 450,
    overflowX: "hidden",
    textOverflow: "ellipsis"
  },
  meta: {
    marginRight: theme.spacing.unit*1.5,
  },
  dragHandle: {
    pointerEvents: "none",
    color: "rgba(0,0,0,0.5)",
    marginRight: theme.spacing.unit,
    cursor: "pointer",
  },
  removeIcon: {
    opacity: 0,
    color: "rgba(0,0,0,0.3)",
    marginLeft: "auto"
  }
}));

const PostsItemWrapper = ({document, loading, classes, ...props}) => {
  const { PostsTitle, PostsItem2MetaInfo } = Components

  if (document && !loading) {
    return <div className={classes.root}>
      <DragIcon className={classes.dragHandle}/>
      <span className={classes.title}>
        <PostsTitle post={document} isLink={false}/>
      </span>
      <PostsItem2MetaInfo className={classes.meta}>
        {document.user.displayName}
      </PostsItem2MetaInfo>
      <PostsItem2MetaInfo className={classes.meta}>
        {document.baseScore} points
      </PostsItem2MetaInfo>
      <RemoveIcon className={classes.removeIcon} onClick={() => props.removeItem(document._id)} />
    </div>
  } else {
    return <Components.Loading />
  }
};

const PostsItemWrapperComponent = registerComponent('PostsItemWrapper', PostsItemWrapper,
  withSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    enableTotal: false,
  }),
  withStyles(styles, {name: "PostsItemWrapper"}));

declare global {
  interface ComponentTypes {
    PostsItemWrapper: typeof PostsItemWrapperComponent
  }
}

