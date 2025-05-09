import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import DragIcon from '@/lib/vendor/@material-ui/icons/src/DragHandle';
import RemoveIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import AddIcon from '@/lib/vendor/@material-ui/icons/src/Add';
import classNames from 'classnames';
import { Loading } from "../vulcan-core/Loading";
import { PostsTitle } from "./PostsTitle";
import { PostsItem2MetaInfo } from "./PostsItem2MetaInfo";
import { PostsUserAndCoauthors } from "./PostsUserAndCoauthors";

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

const PostsItemWrapperInner = ({documentId, classes, addItem, removeItem, disabled = false, simpleAuthor = false, draggable = true}: {
  documentId: string,
  classes: ClassesType<typeof styles>,
  addItem?: any,
  removeItem?: any,
  disabled?: boolean,
  simpleAuthor?: boolean,
  draggable?: boolean
}) => {
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
    return <Loading />
  }
};

export const PostsItemWrapper = registerComponent('PostsItemWrapper', PostsItemWrapperInner, {styles});



