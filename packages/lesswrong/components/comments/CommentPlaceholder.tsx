import React, { useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentPoolContext } from './CommentPool';
import type { CommentTreeOptions } from './commentTree';
import type { CommentTreeNode } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  childrenOfPlaceholder: {
  },
  loadMoreAncestors: {
    paddingLeft: 8,
  },
});

/**
 * A placeholder for a comment that isn't loaded, but which is necessary to make
 * the comments that are loaded thread properly.
 */
const CommentPlaceholder = ({treeOptions, treeNode, nestingLevel, isChild, classes }: {
  treeOptions: CommentTreeOptions,
  treeNode: CommentTreeNode<CommentsList>,
  nestingLevel: number,
  isChild?: boolean
  classes: ClassesType,
}) => {
  const commentPoolContext = useContext(CommentPoolContext);
  const { CommentFrame, CommentNodeOrPlaceholder, LoadMore } = Components;

  async function loadAncestors() {
    await commentPoolContext?.showAncestorChain(treeNode._id);
  }
  
  return <CommentFrame
    comment={null}
    treeOptions={treeOptions}
    onClick={loadAncestors}
    id={treeNode._id}
    nestingLevel={nestingLevel}
    isChild={nestingLevel>1}
  >
    <div className={classes.childrenOfPlaceholder}>
      <LoadMore className={classes.loadMoreAncestors} loadMore={loadAncestors} />
      {treeNode.children.map(treeNode =>
        <CommentNodeOrPlaceholder
          key={treeNode._id}
          treeOptions={treeOptions}
          treeNode={treeNode}
          isChild={true}
          nestingLevel={nestingLevel+1}
        />
      )}
    </div>
  </CommentFrame>
}

const CommentPlaceholderComponent = registerComponent('CommentPlaceholder', CommentPlaceholder, {styles});

declare global {
  interface ComponentTypes {
    CommentPlaceholder: typeof CommentPlaceholderComponent
  }
}

