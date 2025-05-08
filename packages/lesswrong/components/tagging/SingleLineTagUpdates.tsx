import React, {useState} from 'react';
import TagHistory from '@/lib/vendor/@material-ui/icons/src/History';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { ChangeMetrics } from '../../server/collections/revisions/collection';
import { tagGetUrl, tagGetDiscussionUrl, tagGetHistoryUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { ExpandedDate } from '../common/FormatDate';
import moment from 'moment';
import { isFriendlyUI } from '../../themes/forumTheme';
import { tagUrlBaseSetting } from '@/lib/instanceSettings';
import type { DocumentDeletion } from './AllPostsPageTagDocDeletionItem';

export const POSTED_AT_WIDTH = 38

const styles = (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI
      ? {
        background: theme.palette.grey[0],
        border: `1px solid ${theme.palette.grey[100]}`,
        borderRadius: theme.borderRadius.default,
        fontWeight: 500,
        fontSize: 14,
        padding: "6px 0",
        color: theme.palette.grey[600],
      }
      : {
        background: theme.palette.panelBackground.default,
        border: theme.palette.border.commentBorder,
        borderRadius: 3,
        marginBottom: 4,
      }),
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    paddingRight: 8,
    paddingLeft: 8,
    cursor: "pointer",
  },
  title: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
    cursor: "pointer",
    padding: 4,
    fontFamily: theme.typography.fontFamily,
    fontSize: isFriendlyUI ? 14 : 17,
    fontWeight: isFriendlyUI ? 600 : undefined,
    ...theme.typography.smallCaps,
    marginLeft: isFriendlyUI ? 2 : undefined,
  },
  expandedBody: {
    marginTop: 8,
  },
  subheading: {
    fontSize: "1.17rem",
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.link.grey800,
    display: "inline-block",
    marginLeft: 8,
    marginBottom: 8,
  },
  commentBubble: {
    margin: `-5px ${isFriendlyUI ? 6 : 0}px 0 11px`,
  },
  changeMetrics: {
    cursor: "pointer",
    margin: isFriendlyUI ? "0 4px -2px 2px" : undefined,
  },
  postedAt: {
    '&&': {
      cursor: "pointer",
      width: POSTED_AT_WIDTH,
      fontWeight: 300,
      fontSize: "1rem",
      color: theme.palette.text.slightlyIntense2,
      [theme.breakpoints.down('xs')]: {
        width: "auto",
      }
    }
  },
  icon: {
    height: "20px",
  },
  history: {
    display: "flex",
    alignItems: "center",
    fontSize: "1rem",
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.link.dim3,
    margin: `${isFriendlyUI ? -4 : -8}px 0 8px 8px`,
  },
  usernames: {
    marginRight: 16,
    maxWidth: 310,
    textOverflow: "ellipsis",
    overflowX: "hidden",
    textAlign: "right",
    [theme.breakpoints.down('xs')]: {
      maxWidth: 160
    },
  },
  tagRevision: {},
});

const SingleLineTagUpdatesInner = ({tag, revisionIds, commentCount, commentIds, users, changeMetrics, documentDeletions, lastRevisedAt, classes}: {
  tag: TagHistoryFragment,
  revisionIds: string[],
  commentCount?: number,
  commentIds?: string[],
  users?: UsersMinimumInfo[],
  changeMetrics: ChangeMetrics,
  documentDeletions?: DocumentDeletion[] | null,
  classes: ClassesType<typeof styles>,
  lastRevisedAt?: Date
}) => {
  const [expanded,setExpanded] = useState(false);
  const { ChangeMetricsDisplay, PostsItemComments, AllPostsPageTagRevisionItem, CommentById, LWTooltip, PostsItem2MetaInfo, UsersName, AllPostsPageTagDocDeletionItem } = Components;
  
  documentDeletions ??= [];

  return <div className={classes.root} >
    <div className={classes.metadata} onClick={_ev => setExpanded(!expanded)}>

      <div className={classes.title} >
        <Link to={tagGetUrl(tag)}>{tag.name}</Link>
      </div>

      {/* Show lastRevised date with tooltip*/}
      {lastRevisedAt
        ? <LWTooltip placement="right" title={<ExpandedDate date={lastRevisedAt}/>} >
            <PostsItem2MetaInfo className={classes.postedAt}> {moment(new Date(lastRevisedAt)).fromNow()} </PostsItem2MetaInfo>
          </LWTooltip>
        : null
      }
      
      {users && users?.length > 0 && <div className={classes.usernames}>
        <PostsItem2MetaInfo>
          <UsersName user={users[0]}/>
          {users.length > 1 && users.slice(1).map(user =>
            <span key={user._id}>, <UsersName user={user}/></span>
          )}
        </PostsItem2MetaInfo>
      </div>}

      {(changeMetrics.added>0 || changeMetrics.removed>0) && <div className={classes.changeMetrics}>
        <ChangeMetricsDisplay changeMetrics={changeMetrics}/>
      </div>}
      {!!commentCount && commentCount>0 && <Link to={tagGetDiscussionUrl(tag)} className={classes.commentBubble}>
        <PostsItemComments
          small={true}
          commentCount={commentCount}
          unreadComments={false}
          newPromotedComments={false}
        />
      </Link>}
    </div>
    
    {expanded && <div className={classes.expandedBody}>
      {revisionIds.length>0 && 
        <Link
          to={tagGetHistoryUrl(tag)}
          className={classes.history}
        >
          <TagHistory className={classes.icon}  />
          <span>History</span>
        </Link>}
      
      {revisionIds.length>0 && <Link to={`revisions/${tagUrlBaseSetting.get()}/${tag.slug}`} className={classes.subheading}>
        Edits
      </Link>}
      {revisionIds.map(revId => <div key={revId}>
        <AllPostsPageTagRevisionItem
          tag={tag}
          documentId={tag._id}
          revisionId={revId}
        />
      </div>)}

      {documentDeletions.length > 0 && <div className={classes.subheading}>
        Deletions/Restorations
      </div>}
      {documentDeletions.length > 0 && documentDeletions.map(documentDeletion => <div className={classes.tagRevision} key={documentDeletion.documentId}>
        <AllPostsPageTagDocDeletionItem
          tag={tag}
          documentDeletion={documentDeletion}
        />
      </div>)}
      
      {commentIds && commentIds.length>0 && <Link to={tagGetDiscussionUrl(tag)} className={classes.subheading}>
        Comment Threads
      </Link>}
      {commentIds && commentIds.map(commentId =>
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

export const SingleLineTagUpdates = registerComponent('SingleLineTagUpdates', SingleLineTagUpdatesInner, {styles});

declare global {
  interface ComponentTypes {
    SingleLineTagUpdates: typeof SingleLineTagUpdates
  }
}
