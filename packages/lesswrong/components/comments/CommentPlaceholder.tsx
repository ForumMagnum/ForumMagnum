import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import type { CommentTreeNode } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  childrenOfPlaceholder: {
    padding: 8,
  },
});

/**
 * A placeholder for a comment that isn't loaded, but which is necessary to make
 * the comments that are loaded thread properly.
 */
const CommentPlaceholder = ({treeOptions, treeNode, nestingLevel, classes }: {
  treeOptions: CommentTreeOptions,
  treeNode: CommentTreeNode<CommentsList>,
  nestingLevel: number
  classes: ClassesType,
}) => {
  const { CommentFrame, CommentNodeOrPlaceholder } = Components;
  function onClick() {
    // TODO
  }
  
  return <CommentFrame
    comment={null}
    treeOptions={treeOptions}
    onClick={onClick}
    id={treeNode._id}
    nestingLevel={nestingLevel}
  >
    <div className={classes.childrenOfPlaceholder}>
    {treeNode.children.map(treeNode =>
      <CommentNodeOrPlaceholder
        key={treeNode._id}
        treeOptions={treeOptions}
        treeNode={treeNode}
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

