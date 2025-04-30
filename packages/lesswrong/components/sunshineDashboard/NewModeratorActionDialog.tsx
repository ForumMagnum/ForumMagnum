import { MODERATOR_ACTION_TYPES, RATE_LIMIT_ONE_PER_DAY } from '@/lib/collections/moderatorActions/newSchema';
import { useCreate } from '@/lib/crud/withCreate';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { TanStackDatePicker } from '../form-components/FormComponentDateTime';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TanStackSelect } from '../tanstack-form-components/TanStackSelect';
import { cancelButtonStyles, submitButtonStyles } from '../tanstack-form-components/TanStackSubmit';
import { TanStackUserSelect } from '../tanstack-form-components/TanStackUserSelect';
import { useFormErrors } from '../tanstack-form-components/BaseAppForm';

const styles = defineStyles('NewModeratorActionDialog', (theme: ThemeType) => ({
  dialogContent: {
    padding: 30,
    minHeight: 400
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

const NewModeratorActionDialog = ({ onClose, userId }: {
  onClose: () => void,
  userId: string
}) => {
  const { LWDialog } = Components;
  const classes = useStyles(styles);

  const { create, error } = useCreate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionDisplay',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues: Required<Omit<CreateModeratorActionDataInput, 'legacyData'>> & { type: DbModeratorAction['type'] } = {
    userId,
    type: RATE_LIMIT_ONE_PER_DAY,
    endedAt: null,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      let result: ModeratorActionDisplay;

      try {
        const { data } = await create({ data: value });
        result = data?.createModeratorAction.data;
        onClose();
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>
        New Moderator Action
      </DialogTitle>
      {displayedErrorComponent}
      <div className={classes.dialogContent}>
        <form className="vulcan-form" onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}>
          <div className={classes.fieldWrapper}>
            <form.Field name="userId">
              {(field) => (
                <TanStackUserSelect
                  field={field}
                  label="User ID"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="type">
              {(field) => (
                <TanStackSelect
                  field={field}
                  options={Object.entries(MODERATOR_ACTION_TYPES).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  label="Type"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="endedAt">
              {(field) => (
                <TanStackDatePicker
                  field={field}
                  label="Ended at"
                />
              )}
            </form.Field>
          </div>

          <div className="form-submit">
            <Button
              className={classNames("form-cancel", classes.cancelButton)}
              onClick={(e) => {
                e.preventDefault();
                onClose();
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
      </div>
    </LWDialog>
  )
};

const NewModeratorActionDialogComponent = registerComponent('NewModeratorActionDialog', NewModeratorActionDialog);

declare global {
  interface ComponentTypes {
    NewModeratorActionDialog: typeof NewModeratorActionDialogComponent
  }
}
