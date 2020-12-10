import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';

const styles = (theme: ThemeType): JssStyles => ({
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
});

const PostsItemWrapper = ({documentId, classes, removeItem}: {
  documentId: string,
  classes: ClassesType,
  removeItem: any,
}) => {
  const { PostsTitle, PostsItem2MetaInfo, PostsUserAndCoauthors } = Components
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  if (document && !loading) {
    return <div className={classes.root}>
      <DragIcon className={classes.dragHandle}/>
      <span className={classes.title}>
        <PostsTitle post={document} isLink={false}/>
      </span>
      <PostsItem2MetaInfo className={classes.meta}>
        <PostsUserAndCoauthors post={document} abbreviateIfLong={true}/>
      </PostsItem2MetaInfo>
      <PostsItem2MetaInfo className={classes.meta}>
        {document.baseScore} points
      </PostsItem2MetaInfo>
      <RemoveIcon className={classes.removeIcon} onClick={() => removeItem(document._id)} />
    </div>
  } else {
    return <Components.Loading />
  }
};

const PostsItemWrapperComponent = registerComponent('PostsItemWrapper', PostsItemWrapper, {styles});

declare global {
  interface ComponentTypes {
    PostsItemWrapper: typeof PostsItemWrapperComponent
  }
}

