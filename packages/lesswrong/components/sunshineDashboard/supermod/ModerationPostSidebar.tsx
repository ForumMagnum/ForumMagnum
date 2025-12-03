import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import HomeIcon from '@/lib/vendor/@material-ui/icons/src/Home';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import VisibilityOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/VisibilityOutlined';
import { MANUAL_FLAG_ALERT } from '@/lib/collections/moderatorActions/constants';
import classNames from 'classnames';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import ForumIcon from '@/components/common/ForumIcon';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { usePostReviewActions } from './usePostReviewActions';
import ModeratorCoreTagsChecklist from './ModeratorCoreTagsChecklist';

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
    minHeight: 64,
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
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  buttonIcon: {
    width: 14,
    marginRight: 4,
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

  const { markAsPersonal, markAsFrontpage, moveToDraft, flagUser } = usePostReviewActions(post, currentUser, dispatch);

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
          <ModeratorCoreTagsChecklist post={post} dispatch={dispatch} />
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
          <Button onClick={markAsPersonal} className={classes.button}>
            <PersonIcon className={classes.buttonIcon} />
            Personal
            {autoFrontpage === "hide" && (
              <span className={classes.robotIcon}>
                <ForumIcon icon="Robot" />
              </span>
            )}
            <KeystrokeDisplay keystroke="P" withMargin />
          </Button>
          {post.submitToFrontpage && (
            <Button onClick={markAsFrontpage} className={classes.button}>
              <HomeIcon className={classes.buttonIcon} />
              Frontpage
              {autoFrontpage === "show" && (
                <span className={classes.robotIcon}>
                  <ForumIcon icon="Robot" />
                </span>
              )}
              <KeystrokeDisplay keystroke="F" withMargin />
            </Button>
          )}
          <Button onClick={moveToDraft} className={classes.button}>
            <ClearIcon className={classes.buttonIcon} />
            Draft
            <KeystrokeDisplay keystroke="D" withMargin />
          </Button>
          <Button
            onClick={flagUser}
            disabled={isUserAlreadyFlagged}
            className={classes.button}
          >
            <VisibilityOutlinedIcon className={classes.buttonIcon} />
            Flag User
            <KeystrokeDisplay keystroke="U" withMargin />
          </Button>
        </div>
      </div>

      <div className={classes.postWrapper} key={post._id}>
        <PostsPageWrapper documentId={post._id} sequenceId={null} embedded />
      </div>
    </div>
  );
};

export default ModerationPostSidebar;

