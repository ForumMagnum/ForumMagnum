import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { ChangeMetrics } from '../../lib/collections/revisions/collection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "white",
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderRadius: 3,
  },
  metadata: {
    display: "flex",
    paddingRight: 8,
    paddingLeft: 8,
  },
  title: {
    flexGrow: 1,
    padding: 4,
    ...theme.typography.postStyle,
    fontSize: 14,
  },
  changeMetrics: {
    marginTop: 6,
  },
});

const SingleLineTagUpdates = ({tag, revisionCount, revisionIds, commentCount, commentIds, changeMetrics, before, after, classes}: {
  tag: TagBasicInfo,
  revisionCount: number,
  revisionIds: string[],
  commentCount: number,
  commentIds: string[],
  changeMetrics: ChangeMetrics,
  before: string,
  after: string,
  classes: ClassesType,
}) => {
  const [expanded,setExpanded] = useState(false);
  const { ChangeMetricsDisplay, PostsItemComments, TagRevisionItemWrapper, CommentById } = Components;
  
  return <div className={classes.root} onClick={ev => setExpanded(true)}>
    <div className={classes.metadata}>
      <div className={classes.title}>{tag.name}</div>
      {(changeMetrics.added>0 || changeMetrics.removed>0) && <div className={classes.changeMetrics}>
        <ChangeMetricsDisplay changeMetrics={changeMetrics}/>
      </div>}
      {commentCount>0 && <PostsItemComments
        small={true}
        commentCount={commentCount}
        unreadComments={false}
        newPromotedComments={false}
      />}
    </div>
    
    {expanded && <div>
      {revisionIds.map(revId =>
        <TagRevisionItemWrapper
          key={revId}
          tag={tag}
          headingStyle="abridged"
          documentId={tag._id}
          revisionId={revId}
        />
      )}
      
      {commentIds.map(commentId =>
        <CommentById
          key={commentId}
          commentId={commentId}
          treeOptions={{
            tag,
          }}
        />
      )}
    </div>}
  </div>
}

const SingleLineTagUpdatesComponent = registerComponent('SingleLineTagUpdates', SingleLineTagUpdates, {styles});

declare global {
  interface ComponentTypes {
    SingleLineTagUpdates: typeof SingleLineTagUpdatesComponent
  }
}
