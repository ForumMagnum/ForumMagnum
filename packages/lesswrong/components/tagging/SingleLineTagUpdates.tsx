import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { ChangeMetrics } from '../../lib/collections/revisions/collection';
import { tagGetUrl, tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { ExpandedDate } from '../common/FormatDate';
import classNames from 'classnames';
import moment from 'moment';

export const POSTED_AT_WIDTH = 38

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "white",
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderRadius: 3,
    marginBottom: 4,
  },
  collapsed: {
    cursor: "pointer",
  },
  metadata: {
    display: "flex",
    paddingRight: 8,
    paddingLeft: 8,
  },
  title: {
    flexGrow: 1,
    cursor: "pointer",
    padding: 4,
    
    fontFamily: theme.typography.fontFamily,
    fontSize: 17,
    fontVariant: "small-caps",
  },
  expandedBody: {
    marginTop: 8,
  },
  subheading: {
    fontSize: "1.17rem",
    fontFamily: theme.typography.fontFamily,
    color: "#424242",
    display: "inline-block",
    marginLeft: 8,
    marginBottom: 8,
  },
  commentBubble: {
    marginLeft: 6,
  },
  changeMetrics: {
    marginTop: 6,
    cursor: "pointer",
  },
  postedAt: {
    '&&': {
      cursor: "pointer",
      width: POSTED_AT_WIDTH,
      marginTop: 5,
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('xs')]: {
        width: "auto",
      }
    }
  },
});

const SingleLineTagUpdates = ({tag, revisionIds, commentCount, commentIds, changeMetrics, lastRevisedAt, classes}: {
  tag: TagBasicInfo,
  revisionIds: string[],
  commentCount: number,
  commentIds: string[],
  changeMetrics: ChangeMetrics,
  classes: ClassesType,
  lastRevisedAt?: Date
}) => {
  const [expanded,setExpanded] = useState(false);
  const { ChangeMetricsDisplay, PostsItemComments, AllPostsPageTagRevisionItem, CommentById, LWTooltip, PostsItem2MetaInfo } = Components;
  
  return <div className={classNames(classes.root, {
    expanded: expanded,
    collapsed: !expanded,
  })} onClick={ev => setExpanded(true)}>
    <div className={classes.metadata}>
      {expanded
        ? <Link className={classes.title} to={tagGetUrl(tag)}>{tag.name}</Link>
        : <div className={classes.title}>{tag.name}</div>
      }

      {/* Show lastRevised date with tooltip*/}
      {lastRevisedAt
        ? <LWTooltip placement="right" title={<ExpandedDate date={lastRevisedAt}/>} >
            <PostsItem2MetaInfo className={classes.postedAt}> {moment(new Date(lastRevisedAt)).fromNow()} </PostsItem2MetaInfo>
          </LWTooltip>
        : null
      }

      {(changeMetrics.added>0 || changeMetrics.removed>0) && <div className={classes.changeMetrics}>
        <ChangeMetricsDisplay changeMetrics={changeMetrics}/>
      </div>}
      {commentCount>0 && <Link to={tagGetDiscussionUrl(tag)} className={classes.commentBubble}>
        <PostsItemComments
          small={true}
          commentCount={commentCount}
          unreadComments={false}
          newPromotedComments={false}
        />
      </Link>}
    </div>
    
    {expanded && <div className={classes.expandedBody}>
      {revisionIds.length>0 && <Link to={`/revisions/tag/${tag.slug}`} className={classes.subheading}>
        Edits
      </Link>}
      {revisionIds.map(revId => <div className={classes.tagRevision} key={revId}>
        <AllPostsPageTagRevisionItem
          tag={tag}
          documentId={tag._id}
          revisionId={revId}
        />
      </div>)}
      
      {commentIds.length>0 && <Link to={tagGetDiscussionUrl(tag)} className={classes.subheading}>
        Comment Threads
      </Link>}
      {commentIds.map(commentId =>
        <CommentById
          key={commentId}
          commentId={commentId}
          nestingLevel={2}
          isChild={true}
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
