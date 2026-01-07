import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SunshineUserMessages from '../SunshineUserMessages';
import { useCurrentUser } from '@/components/common/withUser';
import ModeratorNotes from './ModeratorNotes';
import SupermodModeratorActionItem from './SupermodModeratorActionItem';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import type { InboxAction } from './inboxReducer';
import UserRateLimitItem from '../UserRateLimitItem';
import classNames from 'classnames';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import LWDialog from '@/components/common/LWDialog';
import { ModerationTemplatesForm } from '@/components/moderationTemplates/ModerationTemplateForm';
import { gql } from '@/lib/generated/gql-codegen';

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  userMessages: {
    overflow: 'auto',
  },
  userModActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modActionItem: {
    flexShrink: 0,
  },
  noBottomMargin: {
    marginBottom: 0,
  },
  newTemplateButton: {
    marginTop: 'auto',
    flexShrink: 0,
  },
  dialogContent: {
    padding: 20,
  },
}));

const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateSunshineUserMessagesQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const ModerationSidebar = ({
  user,
  currentUser: currentUserProp,
  dispatch,
}: {
  user: SunshineUsersList;
  currentUser?: UsersCurrent;
  dispatch?: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const currentUserFromHook = useCurrentUser();
  const currentUser = currentUserProp ?? currentUserFromHook;
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  if (!currentUser) {
    return null;
  }

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
      {/* <div className={classes.section}>
        <ModeratorNotes user={user} currentUser={currentUser} />
      </div>

      {dispatch && (
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Outstanding Moderator Actions</div>
          <div className={classes.userModActions}>
            {user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)).map(action => (
              <div key={action._id} className={classes.modActionItem}>
                <SupermodModeratorActionItem user={user} moderatorAction={action} dispatch={dispatch} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={classes.section}>
        <div className={classNames(classes.sectionTitle, classes.noBottomMargin)}>Rate Limits</div>
        <div className={classes.userModActions}>
          <UserRateLimitItem user={user} />
        </div>
      </div> */}

      <div className={classes.section}>
        <div className={classes.sectionTitle}>User Messages</div>
        <div className={classes.userMessages}>
          {/* TODO: maybe "expand" should actually open a model with the contents, since expanding a conversation inline is kind of annoying with the "no overflow" thing */}
          <SunshineUserMessages key={user._id} user={user} currentUser={currentUser} showExpandablePreview />
        </div>
      </div>

      <div className={classes.newTemplateButton}>
        <Button onClick={() => setShowNewTemplateModal(true)}>
          NEW MOD TEMPLATE
        </Button>
      </div>

      <LWDialog
        open={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        title="New Moderation Template"
      >
        <div className={classes.dialogContent}>
          <ModerationTemplatesForm
            onSuccess={() => {
              setShowNewTemplateModal(false);
            }}
            onCancel={() => setShowNewTemplateModal(false)}
            {...({
              refetchQueries: [{
                query: ModerationTemplatesListQuery,
                variables: {
                  selector: { moderationTemplatesList: { collectionName: "Messages" } },
                  limit: 50,
                  enableTotal: false,
                },
              }]
            } as any)}
          />
        </div>
      </LWDialog>
    </div>
  );
};

export default ModerationSidebar;
