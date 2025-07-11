import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogContent } from "@/components/widgets/DialogContent";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import LWDialog from "../common/LWDialog";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const UnclaimedReportsListMutation = gql(`
  mutation createReportReportForm($data: CreateReportDataInput!) {
    createReport(data: $data) {
      data {
        ...UnclaimedReportsList
      }
    }
  }
`);

const formStyles = defineStyles('ReportsForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const ReportForm = ({ userId, postId, commentId, reportedUserId, onClose, onSubmit, title, link }: {
  userId: string,
  postId?: string,
  commentId?: string,
  reportedUserId?: string,
  onClose?: () => void,
  onSubmit?: () => void,
  title?: string,
  link: string,
}) => {
  const classes = useStyles(formStyles);

  const handleSubmit = () => {
    onSubmit?.();
    onClose?.();
  };

  const [create] = useMutation(UnclaimedReportsListMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues = {
    userId,
    postId,
    reportedUserId,
    commentId,
    link,
    description: '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        let result: UnclaimedReportsList;

        const { data } = await create({ variables: { data: value } });
        if (!data?.createReport?.data) {
          throw new Error('Failed to create report');
        }
        result = data.createReport.data;

        handleSubmit();
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  return (
    <LWDialog
      title={title}
      open={true}
      onClose={onClose}
    >
      <DialogContent>
        <form className="vulcan-form" onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}>
          {displayedErrorComponent}
          <div className={classes.fieldWrapper}>
            <form.Field name="description">
              {(field) => (
                <MuiTextField<string>
                  field={field}
                  placeholder="What are you reporting this comment for?"
                  label="Reason"
                />
              )}
            </form.Field>
          </div>

          <div className="form-submit">
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
      </DialogContent>
    </LWDialog>
  )
}

export default registerComponent('ReportForm', ReportForm);



