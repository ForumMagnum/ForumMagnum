import moment from 'moment';
import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear'
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { cancelButtonStyles, submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { FormComponentDatePicker } from '../form-components/FormComponentDateTime';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import MetaInfo from "../common/MetaInfo";
import LWTooltip from "../common/LWTooltip";
import { withDateFields } from '@/lib/utils/dateUtils';
import { useMutation } from "@apollo/client/react";
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from "@/lib/generated/gql-codegen";

const UserRateLimitDisplayMultiQuery = gql(`
  query multiUserRateLimitUserRateLimitItemQuery($selector: UserRateLimitSelector, $limit: Int, $enableTotal: Boolean) {
    userRateLimits(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserRateLimitDisplay
      }
      totalCount
    }
  }
`);

const UserRateLimitMutationFragmentUpdateMutation = gql(`
  mutation updateUserRateLimitUserRateLimitItem1($selector: SelectorInput!, $data: UpdateUserRateLimitDataInput!) {
    updateUserRateLimit(selector: $selector, data: $data) {
      data {
        ...UserRateLimitMutationFragment
      }
    }
  }
`);

const UserRateLimitDisplayUpdateMutation = gql(`
  mutation updateUserRateLimitUserRateLimitItem($selector: SelectorInput!, $data: UpdateUserRateLimitDataInput!) {
    updateUserRateLimit(selector: $selector, data: $data) {
      data {
        ...UserRateLimitDisplay
      }
    }
  }
`);

const UserRateLimitMutationFragmentCreateMutation = gql(`
  mutation createUserRateLimitUserRateLimitItem1($data: CreateUserRateLimitDataInput!) {
    createUserRateLimit(data: $data) {
      data {
        ...UserRateLimitMutationFragment
      }
    }
  }
`);

const UserRateLimitDisplayMutation = gql(`
  mutation createUserRateLimitUserRateLimitItem($data: CreateUserRateLimitDataInput!) {
    createUserRateLimit(data: $data) {
      data {
        ...UserRateLimitDisplay
      }
    }
  }
`);

const styles = defineStyles('UserRateLimitItem', (theme: ThemeType) => ({
  setRateLimit: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
  },
  rateLimitButton: {
    border: theme.palette.border.slightlyFaint,
    borderRadius: 3,
    padding: '4px 8px',
    minHeight: 'unset',
    lineHeight: 'inherit',
  },
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
}));

const USER_RATE_LIMIT_TYPES = {
  allComments: "Comments",
  allPosts: "Posts",
};

const INTERVAL_UNITS = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
  weeks: "weeks",
};

type RateLimitInput = Pick<DbUserRateLimit, 'userId' | 'type' | 'intervalLength' | 'intervalUnit' | 'actionsPerInterval' | 'endedAt'>;

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

const formStyles = defineStyles('SurveySchedulesForm', (theme: ThemeType) => ({
  defaultFormSection: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));


type EditableUserRateLimit = Required<Omit<{
  [k in keyof UpdateUserRateLimitDataInput]-?: NonNullable<UpdateUserRateLimitDataInput[k]>
}, 'legacyData'>> & { _id: string; };

type EditableUserRateLimitFormData = {
  onSuccess: (doc: UserRateLimitDisplay) => void;
  onCancel: () => void;
} & (
  | {
    initialData: EditableUserRateLimit;
    prefilledProps?: undefined;
  }
  | {
    initialData?: undefined;
    prefilledProps: RateLimitInput;
  }
);

export const UserRateLimitsForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
}: EditableUserRateLimitFormData) => {
  const classes = useStyles(formStyles);
  const formType = initialData ? 'edit' : 'new';

  const [create] = useMutation(UserRateLimitDisplayMutation);

  const [mutate] = useMutation(UserRateLimitDisplayUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...(initialData ? initialData : prefilledProps),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        let result: UserRateLimitDisplay;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: value } });
          if (!data?.createUserRateLimit?.data) {
            throw new Error('Failed to create user rate limit');
          }
          result = data.createUserRateLimit.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateUserRateLimit?.data) {
            throw new Error('Failed to update user rate limit');
          }
          result = data.updateUserRateLimit.data;
        }

        onSuccess(result);
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <div className={classes.defaultFormSection}>
        <div className={classNames('input-type', classes.fieldWrapper)}>
          <form.Field name="type">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={Object.entries(USER_RATE_LIMIT_TYPES).map(([value, label]) => ({ value, label }))}
                label="Type"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('input-intervalUnit', classes.fieldWrapper)}>
          <form.Field name="intervalUnit">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={Object.entries(INTERVAL_UNITS).map(([value, label]) => ({ value, label }))}
                label="Interval unit"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('input-intervalLength', classes.fieldWrapper)}>
          <form.Field name="intervalLength">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Interval length"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('input-actionsPerInterval', classes.fieldWrapper)}>
          <form.Field name="actionsPerInterval">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Actions per interval"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('input-endedAt', classes.fieldWrapper)}>
          <form.Field name="endedAt">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Ended at"
              />
            )}
          </form.Field>
        </div>
      </div>


      <div className="form-submit">
        <Button
          className={classNames("form-cancel", classes.cancelButton)}
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          Cancel
        </Button>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

type UserRateLimitItemProps = {
  userId: string;
  user?: undefined;
} | {
  userId?: undefined;
  user: SunshineUsersList;
};

export const UserRateLimitItem = (props: UserRateLimitItemProps) => {
  const classes = useStyles(styles);

  const userId = props.userId ?? props.user._id;

  const [editingExistingRateLimitId, setEditingExistingRateLimitId] = useState<string>();

  const { data, refetch } = useQuery(UserRateLimitDisplayMultiQuery, {
    variables: {
      selector: { userRateLimits: { userIds: [userId], active: true } },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    skip: !userId,
  });

  const existingRateLimits = data?.userRateLimits?.results ?? props.user?.userRateLimits;

  const [mutate] = useMutation(UserRateLimitMutationFragmentUpdateMutation);

  const endExistingRateLimit = async (rateLimitId: string) => {
    await mutate({
      variables: {
        selector: { _id: rateLimitId },
        data: { endedAt: new Date() }
      }
    });
    await refetch();
  }

  const prefilledCustomFormProps: RateLimitInput = {
    userId,
    type: 'allComments',
    intervalLength: 1,
    intervalUnit: 'days',
    actionsPerInterval: 3,
    endedAt: moment().add(3, 'weeks').toDate()
  };

  if (!existingRateLimits) {
    return <Loading />;
  }

  const existingRateLimit = existingRateLimits.find(rateLimit => rateLimit._id === editingExistingRateLimitId);
  const existingOrDefaultValue = existingRateLimit ? { initialData: withDateFields(existingRateLimit, ['endedAt']) } : { prefilledProps: prefilledCustomFormProps };

  return <div>
    {editingExistingRateLimitId && <div className={classes.rateLimitForm}>
      <UserRateLimitsForm
        {...existingOrDefaultValue}
        onSuccess={async () => {
          await refetch();
          setEditingExistingRateLimitId(undefined);
        }}
        onCancel={() => {
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
            <ClearIcon className={classes.clearIcon} onClick={() => endExistingRateLimit(existingRateLimit._id)} />
          </span>
        </LWTooltip>
      </div>)}
  </div>;
}

export default registerComponent('UserRateLimitItem', UserRateLimitItem);
