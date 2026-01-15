import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import ModeratorActionItem from '../ModeratorUserInfo/ModeratorActionItem';
import { UserRateLimitsList } from '../UserRateLimitsList';
import { persistentDisplayedModeratorActions } from '@/lib/collections/moderatorActions/constants';
import type { InboxAction } from './inboxReducer';
import moment from 'moment';
import { gql } from '@/lib/generated/gql-codegen';
import { UserRateLimitsForm } from '../UserRateLimitsForm';

const SunshineUsersListMultiQuery = gql(`
  query multiUserSupermodModeratorActionsQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const styles = defineStyles('SupermodModeratorActions', (theme: ThemeType) => ({
  modActionsRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modActionItem: {},
  rateLimitSection: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  rateLimitButton: {
    border: theme.palette.border.slightlyFaint,
    borderRadius: 3,
    padding: '4px 8px',
    minHeight: 'unset',
    lineHeight: 'inherit',
    cursor: 'pointer',
  },
  rateLimitForm: {
    marginTop: 16,
    [theme.breakpoints.up('md')]: {
      border: theme.palette.border.normal,
      paddingLeft: 10,
      marginTop: 16,
      '& .form-section-default > div': {
        display: "flex",
        flexWrap: "wrap",
      },
      '& .input-type, & .input-intervalUnit, & .input-intervalLength, & .input-actionsPerInterval': {
        width: "calc(33% - 12px)",
        overflow: "hidden",
        marginRight: 12
      },
      '& .input-endedAt': {
        marginRight: 12
      },
      '& .input-endedAt .DatePicker-wrapper': {
        marginTop: 5
      },
      '& .form-submit': {
        display: "flex",
        justifyContent: "flex-end"
      }
    }
  },
}));

const SupermodModeratorActions = ({user, dispatch}: {user: SunshineUsersList, dispatch: React.ActionDispatch<[action: InboxAction]>}) => {
  const classes = useStyles(styles);
  const activeModeratorActions = user.moderatorActions?.filter(action => action.active && persistentDisplayedModeratorActions.has(action.type)) ?? [];
  const [showRateLimitForm, setShowRateLimitForm] = useState(false);

  const prefilledCustomFormProps = {
    userId: user._id,
    type: 'allComments' as const,
    intervalLength: 1,
    intervalUnit: 'days' as const,
    actionsPerInterval: 3,
    endedAt: moment().add(3, 'weeks').toDate()
  };

  return (
    <div>
      <div className={classes.modActionsRow}>
          {activeModeratorActions.map(action => (
            <div key={action._id} className={classes.modActionItem}>
              <ModeratorActionItem user={user} moderatorAction={action} comments={[]} posts={[]} />
            </div>
          ))}
        </div>
      <div className={classes.rateLimitSection}>
        <ModerationPermissionButtons user={user} dispatch={dispatch} />
        <div
          className={classes.rateLimitButton}
          onClick={() => setShowRateLimitForm(true)}
        >
          Limit
        </div>
      </div>
      {showRateLimitForm && (
        <div className={classes.rateLimitForm}>
          <UserRateLimitsForm
            prefilledProps={prefilledCustomFormProps}
            onSuccess={() => {
              setShowRateLimitForm(false);
            }}
            onCancel={() => {
              setShowRateLimitForm(false);
            }}
          />
        </div>
      )}
      {user.userRateLimits && <UserRateLimitsList rateLimits={user.userRateLimits} />}
    </div>
  );
}

export default SupermodModeratorActions;
