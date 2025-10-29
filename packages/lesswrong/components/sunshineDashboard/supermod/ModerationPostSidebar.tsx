import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import HomeIcon from '@/lib/vendor/@material-ui/icons/src/Home';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import VisibilityOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/VisibilityOutlined';
import { MANUAL_FLAG_ALERT } from '@/lib/collections/moderatorActions/constants';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import FooterTagList from '@/components/tagging/FooterTagList';
import classNames from 'classnames';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import ForumIcon from '@/components/common/ForumIcon';
import type { InboxAction } from './inboxReducer';

const PostsListUpdateMutation = gql(`
  mutation updatePostModerationPostSidebar($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const ModeratorActionsCreateMutation = gql(`
  mutation createModeratorActionModerationPostSidebar($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        _id
      }
    }
  }
`);

const styles = defineStyles('ModerationPostSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  actionsSection: {
    padding: 16,
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0,
  },
  predictionBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: '0.85em',
    fontWeight: 500,
    marginBottom: 12,
  },
  predictionFrontpage: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
  predictionPersonal: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[800],
  },
  predictionConfidence: {
    marginLeft: 4,
    opacity: 0.9,
  },
  tagsSection: {
    marginBottom: 12,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    fontSize: 13,
    padding: '6px 12px',
    minWidth: 'auto',
  },
  robotIcon: {
    width: 14,
    marginLeft: 4,
  },
  postWrapper: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

const displayPredictionPercent = (prediction: FrontpageClassification): number => {
  const confidence = prediction.isFrontpage
    ? prediction.probability
    : 1 - prediction.probability;
  return Math.round(confidence * 100);
};

const ModerationPostSidebar = ({
  post,
  currentUser,
  dispatch,
}: {
  post: SunshinePostsList | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);

  const [updatePost] = useMutation(PostsListUpdateMutation);
  const [createModeratorAction] = useMutation(ModeratorActionsCreateMutation);

  const handlePersonal = useCallback(async () => {
    if (!post) return;
    dispatch({ type: 'REMOVE_POST', postId: post._id });
    await updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: null,
          reviewedByUserId: currentUser._id,
          authorIsUnreviewed: false,
        },
      },
    });
  }, [post, currentUser._id, updatePost, dispatch]);

  const handleFrontpage = useCallback(async () => {
    if (!post) return;
    dispatch({ type: 'REMOVE_POST', postId: post._id });
    await updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: new Date(),
          reviewedByUserId: currentUser._id,
          authorIsUnreviewed: false,
        },
      },
    });
  }, [post, currentUser._id, updatePost, dispatch]);

  const handleDraft = useCallback(async () => {
    if (!post) return;
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(userGetProfileUrl(post.user), '_blank');
      dispatch({ type: 'REMOVE_POST', postId: post._id });
      await updatePost({
        variables: {
          selector: { _id: post._id },
          data: {
            draft: true,
          },
        },
      });
    }
  }, [post, updatePost, dispatch]);

  const handleFlagUser = useCallback(async () => {
    if (!post) return;
    const lastManualUserFlag = post.user?.moderatorActions?.find(
      action => action.type === MANUAL_FLAG_ALERT
    );
    const isUserAlreadyFlagged = post.user?.needsReview || lastManualUserFlag?.active;

    if (isUserAlreadyFlagged) return;

    if (post.user) {
      dispatch({
        type: 'UPDATE_POST',
        postId: post._id,
        fields: {
          user: {
            ...post.user,
            needsReview: true,
          },
        },
      });
    }

    await createModeratorAction({
      variables: {
        data: {
          type: MANUAL_FLAG_ALERT,
          userId: post.userId,
        },
      },
    });
  }, [post, createModeratorAction, dispatch]);

  if (!post) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a post to review
        </div>
      </div>
    );
  }

  const prediction = post.frontpageClassification;
  const autoFrontpage = post.autoFrontpage;
  const lastManualUserFlag = post.user?.moderatorActions?.find(
    action => action.type === MANUAL_FLAG_ALERT
  );
  const isUserAlreadyFlagged = post.user?.needsReview || lastManualUserFlag?.active;

  return (
    <div className={classes.root}>
      <div className={classes.actionsSection}>
        <div className={classes.tagsSection}>
          <FooterTagList post={post} showCoreTags highlightAutoApplied />
        </div>

        {prediction && (
          <div
            className={classNames(
              classes.predictionBadge,
              {
                [classes.predictionFrontpage]: prediction.isFrontpage,
                [classes.predictionPersonal]: !prediction.isFrontpage,
              }
            )}
          >
            Predicted: {prediction.isFrontpage ? 'Frontpage' : 'Personal'}
            <span className={classes.predictionConfidence}>
              ({displayPredictionPercent(prediction)}%)
            </span>
          </div>
        )}

        <div className={classes.buttonRow}>
          <Button onClick={handlePersonal} className={classes.button}>
            <PersonIcon style={{ width: 14, marginRight: 4 }} />
            Personal
            {autoFrontpage === "hide" && (
              <span className={classes.robotIcon}>
                <ForumIcon icon="Robot" />
              </span>
            )}
          </Button>
          {post.submitToFrontpage && (
            <Button onClick={handleFrontpage} className={classes.button}>
              <HomeIcon style={{ width: 14, marginRight: 4 }} />
              Frontpage
              {autoFrontpage === "show" && (
                <span className={classes.robotIcon}>
                  <ForumIcon icon="Robot" />
                </span>
              )}
            </Button>
          )}
          <Button onClick={handleDraft} className={classes.button}>
            <ClearIcon style={{ width: 14, marginRight: 4 }} />
            Draft
          </Button>
          <Button
            onClick={handleFlagUser}
            disabled={isUserAlreadyFlagged}
            className={classes.button}
          >
            <VisibilityOutlinedIcon style={{ width: 14, marginRight: 4 }} />
            Flag User
          </Button>
        </div>
      </div>

      <div className={classes.postWrapper}>
        <PostsPageWrapper documentId={post._id} sequenceId={null} embedded />
      </div>
    </div>
  );
};

export default ModerationPostSidebar;

