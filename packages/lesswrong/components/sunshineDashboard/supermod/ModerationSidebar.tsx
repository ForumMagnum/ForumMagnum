import React, { useState, useEffect, useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import UserAutoRateLimitsDisplay from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';
import ContentSummaryRows from '../ModeratorUserInfo/ContentSummaryRows';
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';
import { useQuery } from '@/lib/crud/useQuery';
import { CONTENT_LIMIT } from '../UsersReviewInfoCard';
import SunshineUserMessages from '../SunshineUserMessages';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationSidebar($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModerationSidebarQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  empty: {
    color: theme.palette.grey[600],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    marginBottom: 12,
    flexShrink: 0,
    overflow: 'hidden',
  },
  scrollableSection: {
    marginBottom: 12,
    flexShrink: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  actionButton: {
    width: '100%',
    padding: '10px 16px',
    marginBottom: 8,
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
    '&:active': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  primaryAction: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    },
  },
  dangerAction: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.light,
    '&:hover': {
      backgroundColor: theme.palette.error.light + '20',
      borderColor: theme.palette.error.main,
    },
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
    overflow: 'auto',
  },
  bioContainer: {
    maxHeight: 300,
    overflow: 'auto',
    fontSize: 14,
    lineHeight: 1.5,
  },
  contentSummary: {
    maxHeight: 150,
    overflow: 'auto',
  },
  rateLimits: {
    maxHeight: 150,
    overflow: 'auto',
  },
  userMessages: {
    maxHeight: 200,
    overflow: 'auto',
  },
  keystrokeHint: {
    float: 'right',
    fontSize: 11,
    color: theme.palette.grey[500],
    fontWeight: 400,
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  onActionComplete,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  onActionComplete: () => void;
}) => {
  const classes = useStyles(styles);
  const [notes, setNotes] = useState(user.sunshineNotes);

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  useEffect(() => {
    if (user.sunshineNotes) {
      setNotes(user.sunshineNotes);
    }
  }, [user._id, user.sunshineNotes]);

  const { posts = [] } = usePublishedPosts(user._id, CONTENT_LIMIT);

  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId: user._id } },
      limit: CONTENT_LIMIT,
      enableTotal: false,
    },
    skip: !user,
  });

  const comments = data?.comments?.results ?? [];

  const handleNotes = useCallback(() => {
    if (notes !== user.sunshineNotes) {
      void updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineNotes: notes,
          },
        },
      });
    }
  }, [user._id, user.sunshineNotes, notes, updateUser]);

  useEffect(() => {
    return () => {
      handleNotes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a user to review
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Moderator Notes</div>
        <div className={classes.notes}>
          <Input
            value={notes ?? ''}
            fullWidth
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotes}
            disableUnderline
            placeholder="Notes for other moderators"
            multiline
            rows={6}
          />
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>Content Summary</div>
        <div className={classes.contentSummary}>
          <ContentSummaryRows user={user} posts={posts} comments={comments} loading={false} />
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>Automod Rate Limits</div>
        <div className={classes.rateLimits}>
          <UserAutoRateLimitsDisplay user={user} showKarmaMeta />
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>User Messages</div>
        <div className={classes.userMessages}>
          <SunshineUserMessages user={user} currentUser={currentUser} />
        </div>
      </div>
      
      <div className={classes.scrollableSection}>
        <div className={classes.sectionTitle}>Bio</div>
        <div className={classes.bioContainer} dangerouslySetInnerHTML={{ __html: user.htmlBio }} />
      </div>
    </div>
  );
};

export default ModerationSidebar;
