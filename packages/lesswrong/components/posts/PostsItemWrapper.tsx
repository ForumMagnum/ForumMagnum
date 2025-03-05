import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: theme.palette.border.itemSeparatorBottom,
    paddingBottom: 5,
    '&:hover': {
      '& $addIcon': {
        opacity: 1,
      },
      '& $removeIcon': {
        opacity: 1,
      },
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
  addIcon: {
    opacity: 0,
    color: theme.palette.icon.dim5
  },
  removeIcon: {
    opacity: 0,
    color: theme.palette.icon.dim5
  },
  disabled: {
    opacity: 0.3,
    cursor: "default",
  }
});

const PostsItemWrapper = ({documentId, classes, addItem, removeItem, disabled = false, simpleAuthor = false, draggable = true}: {
  documentId: string,
  classes: ClassesType<typeof styles>,
  addItem?: any,
  removeItem?: any,
  disabled?: boolean,
  simpleAuthor?: boolean,
  draggable?: boolean
}) => {
  const { PostsTitle, PostsItem2MetaInfo, PostsUserAndCoauthors } = Components
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  if (document && !loading) {
    return <div className={classNames(
        classes.root,
        {[classes.disabled]: disabled}
      )}>
      {draggable && <DragIcon className={classes.dragHandle}/>}
      <PostsItem2MetaInfo className={classes.karma}>
        {document.baseScore}
      </PostsItem2MetaInfo>
      <span className={classes.title}>
        <PostsTitle post={document} isLink={false}/>
      </span>
      <PostsItem2MetaInfo className={classes.author}>
        <PostsUserAndCoauthors post={document} abbreviateIfLong={true} simple={simpleAuthor}/>
      </PostsItem2MetaInfo>
      {addItem && <AddIcon className={classes.addIcon} onClick={() => addItem(document._id)} />}
      {removeItem && <RemoveIcon className={classes.removeIcon} onClick={() => removeItem(document._id)} />}
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

