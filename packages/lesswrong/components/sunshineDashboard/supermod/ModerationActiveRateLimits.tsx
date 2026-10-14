import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useForumType } from '@/components/hooks/useForumType';
import type { ForumTypeString } from '@/lib/instanceSettings';
import LWTooltip from '@/components/common/LWTooltip';
import { forumSelect } from '@/lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '@/lib/rateLimits/constants';
import { getStrictestActiveRateLimitNames } from '@/lib/rateLimits/utils';
import { allRateLimits, MODERATOR_ACTION_TYPES, type AllRateLimitTypes } from '@/lib/collections/moderatorActions/constants';
import { getKarmaLiftDescription, getRateLimitDescription } from '../UserRateLimitItem';

const styles = defineStyles('ModerationActiveRateLimits', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    columnGap: 8,
    rowGap: 2,
    alignItems: 'baseline',
    fontSize: 12,
    color: theme.palette.grey[800],
  },
  source: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.grey[500],
  },
  detail: {
    fontSize: 11,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  deemphasized: {
    opacity: 0.5,
  },
  none: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.grey[500],
  },
}));

interface ActiveRateLimitRow {
  key: string;
  // Where the limit comes from: computed from karma, set by hand, or an old-style moderator action
  source: 'Auto' | 'Manual' | 'Mod action';
  description: string;
  detail?: string | null;
  tooltip?: string;
  deemphasized?: boolean;
}

function isRateLimitActionType(type: string): type is AllRateLimitTypes {
  return allRateLimits.some(rateLimitType => rateLimitType === type);
}

function getEndDescription(endedAt: string | null) {
  return endedAt ? `ends ${moment(endedAt).fromNow()}` : null;
}

function isActive(endedAt: string | null) {
  return !endedAt || new Date(endedAt) > new Date();
}

function getActiveRateLimitRows(user: SunshineUsersList, forumType: ForumTypeString): ActiveRateLimitRow[] {
  const autoRateLimits = [...forumSelect(autoPostRateLimits, forumType), ...forumSelect(autoCommentRateLimits, forumType)];
  const autoRows = getStrictestActiveRateLimitNames(user, autoRateLimits).map(({ name, isActive, rateLimitType }): ActiveRateLimitRow => {
    const isNewUserDefault = rateLimitType === 'newUserDefault';
    return {
      key: `auto-${name}`,
      source: 'Auto',
      description: name,
      tooltip: isNewUserDefault ? 'New user default rate limit' : `Calculated via: ${isActive.toString()}`,
      deemphasized: isNewUserDefault,
    };
  });

  const manualRows = (user.userRateLimits ?? [])
    .filter(rateLimit => isActive(rateLimit.endedAt))
    .map((rateLimit): ActiveRateLimitRow => ({
      key: rateLimit._id,
      source: 'Manual',
      description: getRateLimitDescription(rateLimit),
      detail: getEndDescription(rateLimit.endedAt) ?? getKarmaLiftDescription(rateLimit) ?? 'no end date',
    }));

  const moderatorActionRows = (user.moderatorActions ?? []).flatMap((action): ActiveRateLimitRow[] => {
    if (!isRateLimitActionType(action.type) || !isActive(action.endedAt)) return [];
    return [{
      key: action._id,
      source: 'Mod action',
      description: MODERATOR_ACTION_TYPES[action.type],
      detail: getEndDescription(action.endedAt) ?? 'no end date',
    }];
  });

  return [...manualRows, ...moderatorActionRows, ...autoRows];
}

/** Every rate limit currently on the user, whatever its source, in one list */
const ModerationActiveRateLimits = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const rows = getActiveRateLimitRows(user, forumType);

  if (!rows.length) {
    return <div className={classes.none}>No active rate limits</div>;
  }

  return <div className={classes.root}>
    {rows.map(({ key, source, description, detail, tooltip, deemphasized }) => <React.Fragment key={key}>
      <span className={classNames(classes.source, { [classes.deemphasized]: deemphasized })}>{source}</span>
      <LWTooltip title={tooltip} disabled={!tooltip} className={classNames({ [classes.deemphasized]: deemphasized })}>
        <span>{description}</span>
      </LWTooltip>
      <span className={classes.detail}>{detail}</span>
    </React.Fragment>)}
  </div>;
};

export default ModerationActiveRateLimits;
