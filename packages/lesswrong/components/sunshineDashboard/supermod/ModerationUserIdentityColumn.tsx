'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersName from '@/components/users/UsersName';
import LWTooltip from '@/components/common/LWTooltip';
import AltAccountInfo from '../ModeratorUserInfo/AltAccountInfo';
import { Link } from '@/lib/reactRouterWrapper';
import ReviewTriggerBadge from './ReviewTriggerBadge';
import { useUserClientIdsInfo } from '@/components/hooks/useUserClientIdsInfo';

const styles = defineStyles('ModerationUserIdentityColumn', (theme: ThemeType) => ({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  displayNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  displayName: {
    fontSize: 18,
    fontWeight: 600,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  email: {
    color: theme.palette.grey[600],
    fontSize: 14,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  qualitySignalRow: {
    fontSize: 12,
    color: theme.palette.grey[600],
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  altAccountRow: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
}));

const ModerationUserIdentityColumn = ({
  user,
  likelyReviewTrigger,
}: {
  user: SunshineUsersList;
  likelyReviewTrigger: React.ReactNode;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.column}>
      <div className={classes.displayNameRow}>
        <div className={classes.displayName}>
          <UsersName user={user} />
        </div>
        {likelyReviewTrigger && (
          <ReviewTriggerBadge badge={likelyReviewTrigger} />
        )}
      </div>
      <div className={classes.email}>
        {user.email}
      </div>
    </div>
  );
};

export const ModerationUserClientInfo = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);
  const clientIdsInfo = useUserClientIdsInfo(user._id);
  const firstClientId = clientIdsInfo?.associatedClientIds?.[0];
  if (!firstClientId?.firstSeenReferrer && !firstClientId?.firstSeenLandingPage && !clientIdsInfo?.altAccountsDetected) {
    return null;
  }

  return (
    <div className={classes.column}>
      {firstClientId?.firstSeenReferrer && (
        <div className={classes.qualitySignalRow}>
          <LWTooltip title={firstClientId.firstSeenReferrer} inlineBlock={false}>
            <span>
              Referrer: <a href={firstClientId.firstSeenReferrer} target="_blank" rel="noopener noreferrer">{firstClientId.firstSeenReferrer}</a>
            </span>
          </LWTooltip>
        </div>
      )}
      {firstClientId?.firstSeenLandingPage && (
        <div className={classes.qualitySignalRow}>
          <LWTooltip title={firstClientId.firstSeenLandingPage} inlineBlock={false}>
            <span>
              Landing: <Link to={firstClientId.firstSeenLandingPage}>{firstClientId.firstSeenLandingPage}</Link>
            </span>
          </LWTooltip>
        </div>
      )}
      {clientIdsInfo?.altAccountsDetected && (
        <div className={classes.altAccountRow}>
          <AltAccountInfo user={clientIdsInfo} />
        </div>
      )}
    </div>
  );
};

export default ModerationUserIdentityColumn;
