import React, { useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CommentTreeOptions } from './commentTree';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { CommentPoolContext, DontInheritCommentPool } from './CommentPool';
import { singleLineStyles } from './SingleLineComment';
import { commentGetKarma } from '../../lib/collections/comments/helpers'
import classNames from 'classnames';
import sumBy from 'lodash/sumBy';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...singleLineStyles(theme),
    marginBottom: 2,
    paddingLeft: 3,
  },
  odd: {
    backgroundColor: theme.palette.panelBackground.default,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.singleLineCommentOddHovered,
    }
  },
  contents: {
    display: "flex",
    width: "100%",
    marginTop: 6,
    marginLeft: 5,
    marginBottom: 4,
  },
  groupedCommentsExceptLast: {
    flexShrink: 1,
    overflowX: "hidden",
    overflowY: "hidden",
    //textOverflow: "ellipsis",
  },
  lastGroupedComment: {
    flexShrink: 0,
    flexGrow: 1,
  },
  commentCount: {
  },
  groupedCommentAndSeparator: {
  },
  groupedComment: {
    color: theme.palette.text.dim60,
    border: theme.palette.border.commentBorder,
    marginRight: 4,
    padding: 4,
    borderRadius: 2,
  },
  groupedCommentOdd: {
    backgroundColor: theme.palette.panelBackground.commentNodeOdd,
  },
  groupedCommentEven: {
    backgroundColor: theme.palette.panelBackground.commentNodeEven,
  },
  separator: {
    marginLeft: 4,
    marginRight: 6,
    fontSize: 20,
    verticalAlign: "baseline",
    position: "relative",
    top: 1,
  },
  karma: {
    paddingRight: 5,
    paddingTop: 5,
    color: theme.palette.text.dim60,
  },
  username: {
    padding: 5,
    fontWeight: 600,
  },
  
  preview: {
    width: 400,
  },
})

const GroupedCommentsNode = ({groupedComments, childComments, treeOptions, nestingLevel, hideKarma=false, classes}: {
  groupedComments: CommentsList[],
  childComments: CommentTreeNode<CommentsList>[],
  treeOptions: CommentTreeOptions,
  nestingLevel: number,
  hideKarma?: boolean,
  classes: ClassesType,
}) => {
  const { PostsItemComments } = Components;
  const commentPoolContext = useContext(CommentPoolContext);
  const groupedCommentsExceptLast = groupedComments.slice(0, groupedComments.length-1);
  const lastGroupedComment = groupedComments[groupedComments.length-1];

  // Count up off-chain hidden comments. Uses descendentCount, and subtracts the
  // number of comments at the next level of the chain in order to not double-count.
  // Then subtract off the number accounted for by child-comments.
  let hiddenCommentCount = groupedComments[0].descendentCount
    - groupedComments.length
    - sumBy(childComments, c=>(c.item?.descendentCount??0)+1)
    + 1;
  
  const onClickExpand = () => {
    if (commentPoolContext) {
      for (let comment of groupedComments) {
        const oldExpansionState = commentPoolContext.getCommentState(comment._id).expansion;
        if (oldExpansionState === "singleLineGroupable") {
          void commentPoolContext.setExpansion(comment._id, "singleLine");
        }
      }
    }
  }
  
  return <div>
    <div
      className={classNames(classes.root, {
        [classes.odd]: (nestingLevel%2)!==0
      })}
      onClick={onClickExpand}
    >
      <div className={classes.contents}>
        <span className={classes.groupedCommentsExceptLast}>
          {groupedCommentsExceptLast.map((groupedComment,i) =>
            <span key={groupedComment._id} className={classes.groupedCommentAndSeparator}>
              {i>0 && <GroupedCommentSeparator classes={classes}/>}
              <GroupedCommentsEntry
                comment={groupedComment}
                nestingLevel={/*nestingLevel+i+1*/ nestingLevel+1}
                treeOptions={treeOptions}
                hideKarma={hideKarma}
                classes={classes}
              />
            </span>
          )}
        </span>
        <span className={classes.lastGroupedComment}>
          <span className={classes.groupedCommentAndSeparator}>
            <GroupedCommentSeparator classes={classes}/>
            <GroupedCommentsEntry
              comment={lastGroupedComment}
              nestingLevel={/*nestingLevel+groupedComments.length*/ nestingLevel+1}
              treeOptions={treeOptions}
              hideKarma={hideKarma}
              classes={classes}
            />
          </span>
        </span>
        {(hiddenCommentCount>0) ? <span className={classes.commentCount}>
          <PostsItemComments
            small={true}
            commentCount={hiddenCommentCount}
            color="neutral"
          />
        </span> : undefined}
      </div>
    </div>

    {/*<div className={classes.children}>
      {childComments.map(child =>
        <div key={child._id}>
          <Components.CommentNodeOrPlaceholder
            treeOptions={treeOptions}
            treeNode={child}
          />
        </div>)
      }
    </div>*/}
  </div>
}

const GroupedCommentSeparator = ({classes}: {
  classes: ClassesType
}) => {
  return <span className={classes.separator}>
    {"›"}
  </span>
}

const GroupedCommentsEntry = ({comment, nestingLevel, treeOptions, hideKarma, classes}: {
  comment: CommentsList,
  nestingLevel: number,
  treeOptions: CommentTreeOptions,
  hideKarma: boolean,
  classes: ClassesType
}) => {
  const { CommentsNode, CommentUserName, ContentStyles, LWTooltip } = Components;

  return <LWTooltip
    placement="bottom-end"
    clickable={false}
    tooltip={false}
    title={<div className={classes.preview}>
      <DontInheritCommentPool>
        <CommentsNode
          truncated
          nestingLevel={1}
          comment={comment}
          treeOptions={{
            ...treeOptions, hideReply: true,
            forceSingleLine: false,
            forceNotSingleLine: true,
            hideParentCommentToggle: true,
          }}
          hoverPreview
        />
      </DontInheritCommentPool>
    </div>}
  >
    <ContentStyles
      contentType={/*comment.answer ? "post" : "comment"*/ "comment"}
    >
      <span className={classNames(
        classes.groupedComment, {
          [classes.groupedCommentOdd]: (nestingLevel%2)===1,
          [classes.groupedCommentEven]: (nestingLevel%2)===0,
        }
      )}>
        {!hideKarma && <span className={classes.karma}>
          {commentGetKarma(comment)}
        </span>}
        <CommentUserName
          comment={comment}
          simple
          className={classes.username}
        />
      </span>
    </ContentStyles>
  </LWTooltip>
}

const GroupedCommentsNodeComponent = registerComponent('GroupedCommentsNode', GroupedCommentsNode, {styles});

declare global {
  interface ComponentTypes {
    GroupedCommentsNode: typeof GroupedCommentsNodeComponent
  }
}

