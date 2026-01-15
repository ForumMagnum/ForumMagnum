import React from 'react';
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
import { useMutation, MutationHookOptions } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const UserRateLimitDisplayUpdateMutation = gql(`
  mutation updateUserRateLimitUserRateLimitItem($selector: SelectorInput!, $data: UpdateUserRateLimitDataInput!) {
    updateUserRateLimit(selector: $selector, data: $data) {
      data {
        ...UserRateLimitDisplay
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

export type RateLimitInput = Pick<DbUserRateLimit, 'userId' | 'type' | 'intervalLength' | 'intervalUnit' | 'actionsPerInterval' | 'endedAt'>;

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
  refetchQueries?: MutationHookOptions['refetchQueries'];
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

const FormField = ({ name, fieldWrapperClass, children }: { name: string; fieldWrapperClass: string; children: React.ReactNode }) => (
  <div className={classNames(`input-${name}`, fieldWrapperClass)}>
    {children}
  </div>
);

export const UserRateLimitsForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
  refetchQueries,
}: EditableUserRateLimitFormData) => {
  const classes = useStyles(formStyles);
  const isEdit = !!initialData;

  const mutationOptions = refetchQueries ? { refetchQueries } : {};
  const [create] = useMutation(UserRateLimitDisplayMutation, mutationOptions);
  const [mutate] = useMutation(UserRateLimitDisplayUpdateMutation, mutationOptions);
  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: initialData ?? prefilledProps,
    onSubmit: async ({ value, formApi }) => {
      try {
        let result: UserRateLimitDisplay;

        if (isEdit) {
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData!._id },
              data: getUpdatedFieldValues(formApi)
            }
          });
          if (!data?.updateUserRateLimit?.data) {
            throw new Error('Failed to update user rate limit');
          }
          result = data.updateUserRateLimit.data;
        } else {
          const { data } = await create({ variables: { data: value } });
          if (!data?.createUserRateLimit?.data) {
            throw new Error('Failed to create user rate limit');
          }
          result = data.createUserRateLimit.data;
        }

        onSuccess(result);
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (isEdit && !initialData) {
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
        <FormField name="type" fieldWrapperClass={classes.fieldWrapper}>
          <form.Field name="type">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={Object.entries(USER_RATE_LIMIT_TYPES).map(([value, label]) => ({ value, label }))}
                label="Type"
              />
            )}
          </form.Field>
        </FormField>

        <FormField name="intervalUnit" fieldWrapperClass={classes.fieldWrapper}>
          <form.Field name="intervalUnit">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={Object.entries(INTERVAL_UNITS).map(([value, label]) => ({ value, label }))}
                label="Interval unit"
              />
            )}
          </form.Field>
        </FormField>

        <FormField name="intervalLength" fieldWrapperClass={classes.fieldWrapper}>
          <form.Field name="intervalLength">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Interval length"
              />
            )}
          </form.Field>
        </FormField>

        <FormField name="actionsPerInterval" fieldWrapperClass={classes.fieldWrapper}>
          <form.Field name="actionsPerInterval">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Actions per interval"
              />
            )}
          </form.Field>
        </FormField>

        <FormField name="endedAt" fieldWrapperClass={classes.fieldWrapper}>
          <form.Field name="endedAt">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Ended at"
              />
            )}
          </form.Field>
        </FormField>
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
