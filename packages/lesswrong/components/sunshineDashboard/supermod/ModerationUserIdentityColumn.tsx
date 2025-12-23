import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersName from '@/components/users/UsersName';
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';
import FormatDate from '@/components/common/FormatDate';
import AltAccountInfo from '../ModeratorUserInfo/AltAccountInfo';
import { Link } from '@/lib/reactRouterWrapper';
import ReviewTriggerBadge from './ReviewTriggerBadge';

const styles = defineStyles('ModerationUserIdentityColumn', (theme: ThemeType) => ({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
    alignItems: 'flex-start',
    width: 180,
  },
  displayNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 600,
    width: 148,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2
  },
  email: {
    color: theme.palette.grey[600],
    fontSize: 14,
    width: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topMetadata: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  createdAt: {
    color: theme.palette.grey[600],
    marginBottom: 2,
  },
  karma: {
    color: theme.palette.grey[600],
    marginBottom: 2,
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
  const firstClientId = user.associatedClientIds?.[0];

  return (
    <div className={classes.column}>
      <div className={classes.displayNameRow}>
        <div className={classes.displayName}>
          <UsersName user={user} />
        </div>
        <LWTooltip title={user.reviewedByUserId ? "Already reviewed; future content will go live by default" : "Unreviewed; future content will require review before going live"}>
          <ForumIcon icon={user.reviewedByUserId ? "Check" : "Eye"} className={classes.icon} />
        </LWTooltip>
      </div>
      <div className={classes.email}>
        {user.email}
      </div>
      <div className={classes.topMetadata}>
        {likelyReviewTrigger && (
          <ReviewTriggerBadge badge={likelyReviewTrigger} />
        )}
        <div className={classes.createdAt}>
          <FormatDate date={user.createdAt} />
        </div>
        <div className={classes.karma}>
          {user.karma} karma
        </div>
      </div>
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
      {user.altAccountsDetected && (
        <div className={classes.altAccountRow}>
          <AltAccountInfo user={user} />
        </div>
      )}
    </div>
  );
};

export default ModerationUserIdentityColumn;

