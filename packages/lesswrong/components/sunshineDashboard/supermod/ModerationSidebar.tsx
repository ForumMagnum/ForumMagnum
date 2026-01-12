import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SunshineUserMessages, { ModerationTemplatesListQuery } from '../SunshineUserMessages';
import { useCurrentUser } from '@/components/common/withUser';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import LWDialog from '@/components/common/LWDialog';
import { ModerationTemplatesForm } from '@/components/moderationTemplates/ModerationTemplateForm';
import type { InboxAction } from './inboxReducer';

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
  newTemplateButton: {
    marginTop: 'auto',
    flexShrink: 0,
  },
  dialogContent: {
    padding: 20,
  },
}));

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
            refetchQueries={[{
              query: ModerationTemplatesListQuery,
              variables: {
                selector: { moderationTemplatesList: { collectionName: "Messages" } },
                limit: 50,
                enableTotal: false,
              },
            }]}
          />
        </div>
      </LWDialog>
    </div>
  );
};

export default ModerationSidebar;
