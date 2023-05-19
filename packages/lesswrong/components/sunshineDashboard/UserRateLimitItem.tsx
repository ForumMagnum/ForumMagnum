import Select from '@material-ui/core/Select';
import moment from 'moment';
import React, { useState } from 'react';
import { USER_RATE_LIMIT_TYPES } from '../../lib/collections/userRateLimits/schema';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import ClearIcon from '@material-ui/icons/Clear'
import { useUpdate } from '../../lib/crud/withUpdate';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
  newRateLimit: {
    minWidth: 180
  },
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
});

const COMMENTS_THREE_PER_DAY = 'comments_3_per_day';
const POSTS_ONE_PER_WEEK = 'posts_1_per_week';
const DEFAULT_RATE_LIMITS: Record<string, (userId: string) => NullablePartial<DbUserRateLimit>> = {
  [COMMENTS_THREE_PER_DAY]: (userId: string) => ({
    userId,
    type: 'allComments',
    intervalLength: 1,
    intervalUnit: 'days',
    actionsPerInterval: 3,
    endedAt: moment().add(3, 'weeks').toDate()
  }),
  [POSTS_ONE_PER_WEEK]: (userId: string) => ({
    userId,
    type: 'allPosts',
    intervalLength: 1,
    intervalUnit: 'weeks',
    actionsPerInterval: 1,
    endedAt: moment().add(12, 'weeks').toDate()
  })
};

const getIntervalDescription = (rateLimit: UserRateLimitDisplay) => {
  const { intervalLength, intervalUnit } = rateLimit;
  if (intervalLength === 1) {
    return intervalUnit.slice(0, -1);
  }
  return `${intervalLength} ${intervalUnit}`;
  // const weekMs = MS_IN_DAY * 7;
  // // At least a week
  // if (intervalMs >= weekMs) {
  //   const weeks = Math.floor(intervalMs / weekMs);
  //   const days = Math.floor((intervalMs % weekMs) / MS_IN_DAY);
  //   const weekSuffix = weeks > 1 ? 's' : '';
  //   const daySuffix = days > 1 ? 's' : '';

  //   const daySection = days > 0 ? `, ${days} day${daySuffix}` : '';

  //   return `${weeks} week${weekSuffix}${daySection}`;
  // }

  // // At least a day
  // if (intervalMs >= MS_IN_DAY) {
  //   const days = Math.floor(intervalMs / MS_IN_DAY);
  //   const daySuffix = days > 1 ? 's' : '';
  //   return `${days} day${daySuffix}`;
  // }

  // // At least an hour
  // const hours = Math.floor(intervalMs / MS_IN_HOUR);
  // const hourSuffix = hours > 1 ? 's' : '';
  // return `${hours} hour${hourSuffix}`;
};

const getRemainingIntervalDescription = (rateLimit: UserRateLimitDisplay) => {
  return moment(rateLimit.endedAt).fromNow();
};

const getRateLimitDescription = (rateLimit: UserRateLimitDisplay) => {
  const intervalDescription = getIntervalDescription(rateLimit);
  return `${USER_RATE_LIMIT_TYPES[rateLimit.type]}, ${rateLimit.actionsPerInterval} per ${intervalDescription}`;
};

export const UserRateLimitItem = ({userId, classes}: {
  userId: string,
  classes: ClassesType,
}) => {
  const { WrappedSmartForm, MenuItem, Loading, MetaInfo, LWTooltip } = Components;
  const [createNewRateLimit, setCreateNewRateLimit] = useState(false);
  const [editingExistingRateLimitId, setEditingExistingRateLimitId] = useState<string>();

  const { results: existingRateLimits, refetch } = useMulti({
    collectionName: 'UserRateLimits',
    fragmentName: 'UserRateLimitDisplay',
    terms: { view: 'userRateLimits', userIds: [userId], active: true }
  });

  const { create } = useCreate({
    collectionName: 'UserRateLimits',
    fragmentName: 'UserRateLimitsDefaultFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'UserRateLimits',
    fragmentName: 'UserRateLimitsDefaultFragment'
  });

  const createRateLimit = async (rateLimitName: string) => {
    if (rateLimitName === 'custom') {
      setCreateNewRateLimit(true);
    } else {
      const newRateLimit = DEFAULT_RATE_LIMITS[rateLimitName](userId);
      await create({
        data: newRateLimit
      });
      await refetch();
    }
  };

  const endExistingRateLimit = async (rateLimitId: string) => {
    await mutate({
      selector: { _id: rateLimitId },
      data: { endedAt: new Date() }
    });
    await refetch();
  }

  const prefilledCustomFormProps = DEFAULT_RATE_LIMITS[COMMENTS_THREE_PER_DAY](userId);

  if (!existingRateLimits) {
    return <Loading />;
  }

  return <div className={classes.root}>
    {/** Doesn't have both a comment and post rate limit */}
    {existingRateLimits.length < 2 && <div>
      Set Rate Limit: <Select
        onChange={(e) => createRateLimit(e.target.value)}
        className={classes.newRateLimit}
      >
        <MenuItem value={COMMENTS_THREE_PER_DAY}>Comments (3 per day for 3 weeks)</MenuItem>
        <MenuItem value={POSTS_ONE_PER_WEEK}>Posts (1 per week for 12 weeks)</MenuItem>
        <MenuItem value='custom'>Custom</MenuItem>
      </Select>
    </div>}
    {(createNewRateLimit || editingExistingRateLimitId) && <WrappedSmartForm
      {...(editingExistingRateLimitId ? {documentId: editingExistingRateLimitId} : {})}
      collectionName='UserRateLimits'
      mutationFragmentName='UserRateLimitDisplay'
      prefilledProps={editingExistingRateLimitId ? {} : prefilledCustomFormProps}
      successCallback={async () => {
        await refetch();
        setCreateNewRateLimit(false);
        setEditingExistingRateLimitId(undefined);
      }}
    />}
    {existingRateLimits.length > 0 && existingRateLimits.map(existingRateLimit =>
      <div key={`user-rate-limit-${existingRateLimit._id}`} className={classes.existingRateLimitInfo}>
        Rate Limit ({getRateLimitDescription(existingRateLimit)})
        <span className={classes.clickToEdit} onClick={() => setEditingExistingRateLimitId(existingRateLimit._id)}>
          <LWTooltip>
            <MetaInfo>{getRemainingIntervalDescription(existingRateLimit)}</MetaInfo>
          </LWTooltip>
        </span>
        <LWTooltip title="End this rate limit">
          <span className={classes.clickToEdit}>
            <ClearIcon className={classes.clearIcon} onClick={() => endExistingRateLimit(existingRateLimit._id)}/>
          </span>
        </LWTooltip>
      </div>)}
  </div>;
}

const UserRateLimitItemComponent = registerComponent('UserRateLimitItem', UserRateLimitItem, {styles});

declare global {
  interface ComponentTypes {
    UserRateLimitItem: typeof UserRateLimitItemComponent
  }
}

