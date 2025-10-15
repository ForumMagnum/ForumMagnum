import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersName from '@/components/users/UsersName';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import FirstContentIcons from '../FirstContentIcons';
import MetaInfo from '@/components/common/MetaInfo';
import { getReasonForReview } from '@/lib/collections/moderatorActions/helpers';
import { truncate } from '@/lib/editor/ellipsize';
import SunshineNewUserPostsList from '../SunshineNewUserPostsList';
import SunshineNewUserCommentsList from '../SunshineNewUserCommentsList';
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { CONTENT_LIMIT } from '../UsersReviewInfoCard';

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModerationDetailViewQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = defineStyles('ModerationDetailView', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    minHeight: '100vh',
  },
  header: {
    padding: '20px 24px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 600,
    marginRight: 12,
  },
  karma: {
    fontSize: 16,
    color: theme.palette.grey[600],
    marginRight: 12,
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  flagIcon: {
    height: 16,
    width: 16,
    color: theme.palette.error.main,
  },
  metadata: {
    display: 'flex',
    gap: 16,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  section: {
    padding: '20px 24px',
    borderBottom: theme.palette.border.faint,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
    letterSpacing: '0.5px',
  },
  bio: {
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.grey[800],
    '& a': {
      color: theme.palette.primary.main,
    },
    '& img': {
      maxWidth: '100%',
    },
  },
  website: {
    fontSize: 14,
    color: theme.palette.primary.main,
    marginTop: 8,
    display: 'block',
  },
  contentSection: {
    padding: 0,
  },
  expandButton: {
    cursor: 'pointer',
    fontSize: 13,
    color: theme.palette.primary.main,
    marginTop: 8,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const DEFAULT_BIO_WORDCOUNT = 250;
const MAX_BIO_WORDCOUNT = 10000;

const ModerationDetailView = ({
  user,
  currentUser,
  onActionComplete,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  onActionComplete: () => void;
}) => {
  const classes = useStyles(styles);
  const [bioWordcount, setBioWordcount] = useState(DEFAULT_BIO_WORDCOUNT);

  const { posts = [], loading: postsLoading } = usePublishedPosts(user._id, CONTENT_LIMIT);

  const { data, loading: commentsLoading } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId: user._id } },
      limit: CONTENT_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const comments = data?.comments?.results ?? [];

  const { reason: reviewTrigger } = getReasonForReview(user);

  const truncatedHtml = truncate(user.htmlBio, bioWordcount, 'words');
  const bioNeedsTruncation = user.htmlBio && user.htmlBio.length > truncatedHtml.length;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerTop}>
          <div className={classes.displayName}>
            <UsersName user={user} />
          </div>
          <div className={classes.karma}>
            {user.karma || 0} karma
          </div>
          <div className={classes.icons}>
            <FirstContentIcons user={user} />
            {user.sunshineFlagged && <FlagIcon className={classes.flagIcon} />}
          </div>
        </div>
        <div className={classes.metadata}>
          {reviewTrigger && reviewTrigger !== 'alreadyApproved' && reviewTrigger !== 'noReview' && (
            <MetaInfo>
              Review trigger: {reviewTrigger}
            </MetaInfo>
          )}
          <MetaInfo>
            {user.postCount || 0} posts
          </MetaInfo>
          <MetaInfo>
            {user.commentCount || 0} comments
          </MetaInfo>
          <MetaInfo>
            {user.voteCount || 0} votes
          </MetaInfo>
        </div>
      </div>

      {(user.htmlBio || user.website) && (
        <div className={classes.section}>
          <div className={classes.sectionTitle}>About</div>
          {user.htmlBio && (
            <div>
              <div
                className={classes.bio}
                dangerouslySetInnerHTML={{ __html: truncatedHtml }}
                onClick={() => bioNeedsTruncation && setBioWordcount(MAX_BIO_WORDCOUNT)}
              />
              {bioNeedsTruncation && bioWordcount < MAX_BIO_WORDCOUNT && (
                <div
                  className={classes.expandButton}
                  onClick={() => setBioWordcount(MAX_BIO_WORDCOUNT)}
                >
                  Show more
                </div>
              )}
            </div>
          )}
          {user.website && (
            <a
              href={`https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.website}
            >
              {user.website}
            </a>
          )}
        </div>
      )}

      {(posts.length > 0 || comments.length > 0) && (
        <div className={classes.contentSection}>
          {posts.length > 0 && (
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Posts ({posts.length})</div>
              <SunshineNewUserPostsList posts={posts} user={user} />
            </div>
          )}
          {comments.length > 0 && (
            <div className={classes.section}>
              <div className={classes.sectionTitle}>Comments ({comments.length})</div>
              <SunshineNewUserCommentsList comments={comments} user={user} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModerationDetailView;
