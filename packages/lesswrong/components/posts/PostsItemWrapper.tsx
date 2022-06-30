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
    borderBottom: theme.palette.border.itemSeparatorBottom,
    paddingBottom: 5,
    '&:hover': {
      '& $removeIcon': {
        opacity: 1,
      }
    }
  },
  title: {
    maxWidth: 450,
    overflow: "hidden",
    textOverflow: "ellipsis",
    position: "relative",
    top: 1
  },
  karma: {
    marginRight: 4,
    minWidth: 42
  },
  author: {
    marginLeft: "auto",
    marginRigt: 12
  },
  dragHandle: {
    pointerEvents: "none",
    color: theme.palette.icon.dim,
    marginRight: theme.spacing.unit,
    cursor: "pointer",
  },
  removeIcon: {
    opacity: 0,
    color: theme.palette.icon.dim5
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
      <PostsItem2MetaInfo className={classes.karma}>
        {document.baseScore}
      </PostsItem2MetaInfo>
      <span className={classes.title}>
        <PostsTitle post={document} isLink={false}/>
      </span>
      <PostsItem2MetaInfo className={classes.author}>
        <PostsUserAndCoauthors post={document} abbreviateIfLong={true}/>
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

