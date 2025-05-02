import Select from '@/lib/vendor/@material-ui/core/src/Select';
import moment from 'moment';
import React, { useState } from 'react';
import { USER_RATE_LIMIT_TYPES } from '../../lib/collections/userRateLimits/newSchema';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear'
import { useUpdate } from '../../lib/crud/withUpdate';

const styles = (theme: ThemeType) => ({
  rateLimitForm: {
    [theme.breakpoints.up('md')]: {
      border: theme.palette.border.normal,
      paddingLeft: 10,
      marginTop: 6,

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
        // width: "calc(33% - 12px)",
        marginRight: 12
      },
      '& .input-endedAt .DatePicker-wrapper': {
        marginTop: 5
        // lineHeight: '1.1875em'
      },
      '& .form-submit': {
        display: "flex",
        justifyContent: "flex-end"
      }
    }
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
const COMMENTS_ONE_PER_DAY = 'comments_1_per_day';
const COMMENTS_ONE_PER_THREE_DAYS = 'comments_1_per_3_days';

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
  [COMMENTS_ONE_PER_DAY]: (userId: string) => ({
    userId,
    type: 'allComments',
    intervalLength: 1,
    intervalUnit: 'days',
    actionsPerInterval: 1,
    endedAt: moment().add(3, 'weeks').toDate()
  }),
  [COMMENTS_ONE_PER_THREE_DAYS]: (userId: string) => ({
    userId,
    type: 'allComments',
    intervalLength: 3,
    intervalUnit: 'days',
    actionsPerInterval: 1,
    endedAt: moment().add(3, 'weeks').toDate()
  }),
  [POSTS_ONE_PER_WEEK]: (userId: string) => ({
    userId,
    type: 'allPosts',
    intervalLength: 1,
    intervalUnit: 'weeks',
    actionsPerInterval: 1,
    endedAt: moment().add(6, 'weeks').toDate()
  })
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

export const UserRateLimitItem = ({userId, classes}: {
  userId: string,
  classes: ClassesType<typeof styles>,
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

  return <div>
    {/** Doesn't have both a comment and post rate limit */}
    {existingRateLimits.length < 2 && <div>
      Set Rate Limit: <Select
        value=''
        onChange={(e) => createRateLimit(e.target.value)}
        className={classes.newRateLimit}
      >
        <MenuItem value={COMMENTS_THREE_PER_DAY}>
          Comments (3 per day for 3 weeks)
        </MenuItem>
        <MenuItem value={COMMENTS_ONE_PER_DAY}>
          Comments (1 per day for 3 weeks)
        </MenuItem>
        <MenuItem value={COMMENTS_ONE_PER_THREE_DAYS}>
          Comments (1 per 3 days for 3 weeks)
        </MenuItem>
        <MenuItem value={POSTS_ONE_PER_WEEK}>
          Posts (1 per week for 6 weeks)
        </MenuItem>
        <MenuItem value='custom'>Custom</MenuItem>
      </Select>
    </div>}
    {(createNewRateLimit || editingExistingRateLimitId) && <div className={classes.rateLimitForm}>
      <WrappedSmartForm
        {...(editingExistingRateLimitId ? {documentId: editingExistingRateLimitId} : {})}
        collectionName='UserRateLimits'
        mutationFragmentName='UserRateLimitDisplay'
        prefilledProps={editingExistingRateLimitId ? {} : prefilledCustomFormProps}
        successCallback={async () => {
          await refetch();
          setCreateNewRateLimit(false);
          setEditingExistingRateLimitId(undefined);
        }}
        cancelCallback={() => {
          setCreateNewRateLimit(false);
          setEditingExistingRateLimitId(undefined);
        }}
      />
    </div>}
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

