import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SunshineUserMessages, { ModerationTemplatesListQuery } from '../SunshineUserMessages';
import { ModerationTemplatesForm } from '@/components/moderationTemplates/ModerationTemplateForm';
import SupermodModeratorActions from './SupermodModeratorActions';
import type { InboxAction } from './inboxReducer';

const styles = defineStyles('ModerationSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
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
    backgroundColor: theme.palette.background.paper,
    padding: 12,
    flexShrink: 0,
    overflow: 'hidden',
    '&:not(:last-child)': {
      borderBottom: theme.palette.border.normal,
    },
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  userMessages: {
    overflow: 'auto',
  },
  newTemplateButton: {
    flexShrink: 0,
    cursor: 'pointer',
  },
  dialogContent: {
    marginTop: 16,
    paddingLeft: 12,
    paddingRight: 0,
    marginLeft: -6,
    marginRight: -6,
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    '& .vulcan-form': {
      marginTop: -16
    },
  },
}));

const ModerationSidebar = ({
  user,
  currentUser,
  dispatch,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

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
        <div className={classes.sectionTitle}>Moderator Actions</div>
        <SupermodModeratorActions user={user} dispatch={dispatch} />
      </div>
      <div className={classes.section}>
        <div className={classes.sectionTitle}>User Messages</div>

        <div className={classes.userMessages}>
          {/* TODO: maybe "expand" should actually open a model with the contents, since expanding a conversation inline is kind of annoying with the "no overflow" thing */}
          <SunshineUserMessages key={user._id} user={user} currentUser={currentUser} showExpandablePreview />
        </div>
        <div className={classes.newTemplateButton} onClick={() => setShowNewTemplateModal(true)}>
          NEW MOD TEMPLATE
        </div>
        {showNewTemplateModal && (
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
        )}
      </div>
    </div>
  );
};

export default ModerationSidebar;
