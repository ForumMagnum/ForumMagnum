import moment from 'moment';
import React from 'react';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear'
import { defineStyles, useStyles } from '../hooks/useStyles';
import MetaInfo from "../common/MetaInfo";
import LWTooltip from "../common/LWTooltip";

const styles = defineStyles('UserRateLimitsList', (theme: ThemeType) => ({
  existingRateLimitInfo: {
    display: "flex",
    alignItems: "center",
    paddingTop: 4
  },
  clickToEdit: {
    marginLeft: 10,
    cursor: "pointer",
    display: "flex",
  },
  clearIcon: {
    width: 12,
    height: 12,
    cursor: "pointer",
    opacity: .5,
    marginRight: 10,
    '&:hover': {
      opacity: 1
    },
  },
}));

const USER_RATE_LIMIT_TYPES = {
  allComments: "Comments",
  allPosts: "Posts",
};

const getIntervalDescription = (rateLimit: UserRateLimitDisplay) => {
  const { intervalLength, intervalUnit } = rateLimit;
  if (intervalLength === 1) {
    return intervalUnit.slice(0, -1);
  }
  return `${intervalLength} ${intervalUnit}`;
};

const getRemainingIntervalDescription = (rateLimit: UserRateLimitDisplay) => {
  return moment(rateLimit.endedAt).fromNow();
};

const getRateLimitDescription = (rateLimit: UserRateLimitDisplay) => {
  const intervalDescription = getIntervalDescription(rateLimit);
  return `${USER_RATE_LIMIT_TYPES[rateLimit.type]}, ${rateLimit.actionsPerInterval} per ${intervalDescription}`;
};

type UserRateLimitsListProps = {
  rateLimits: UserRateLimitDisplay[];
  onEdit?: (rateLimitId: string) => void;
  onEnd?: (rateLimitId: string) => void;
};

export const UserRateLimitsList = ({ rateLimits, onEdit, onEnd }: UserRateLimitsListProps) => {
  const classes = useStyles(styles);

  if (rateLimits.length === 0) {
    return null;
  }

  return (
    <>
      {rateLimits.map(rateLimit =>
        <div key={`user-rate-limit-${rateLimit._id}`} className={classes.existingRateLimitInfo}>
          Rate Limit ({getRateLimitDescription(rateLimit)})
          {onEdit && (
            <span className={classes.clickToEdit} onClick={() => onEdit(rateLimit._id)}>
              <LWTooltip>
                <MetaInfo>{getRemainingIntervalDescription(rateLimit)}</MetaInfo>
              </LWTooltip>
            </span>
          )}
          {onEnd && (
            <LWTooltip title="End this rate limit">
              <span className={classes.clickToEdit}>
                <ClearIcon className={classes.clearIcon} onClick={() => onEnd(rateLimit._id)} />
              </span>
            </LWTooltip>
          )}
        </div>
      )}
    </>
  );
};
