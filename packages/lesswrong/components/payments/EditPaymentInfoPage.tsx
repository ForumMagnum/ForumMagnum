"use client";

import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { isBookUI, preferredHeadingCase } from '@/themes/forumTheme';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useNavigate } from '../../lib/routeUtil';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { LegacyFormGroupLayout } from '@/components/tanstack-form-components/LegacyFormGroupLayout';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import LWTooltip from "../common/LWTooltip";
import Error404 from "../common/Error404";
import SectionTitle from "../common/SectionTitle";
import ContentStyles from "../common/ContentStyles";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const UsersEditUpdateMutation = gql(`
  mutation updateUserEditPaymentInfoPage($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

const styles = defineStyles('EditPaymentInfoPage', (theme: ThemeType) => ({
  root: {
    maxWidth: 600,
    margin: "auto"
  },
  info: {
    marginTop: 25,
    marginBottom: 25
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const UserPaymentInfoForm = ({
  initialData,
  onSuccess,
}: {
  initialData: Pick<UpdateUserDataInput, 'paymentEmail' | 'paymentInfo'> & { _id: string };
  onSuccess: (doc: UsersEdit) => void;
}) => {
  const classes = useStyles(styles);
  const formType = initialData ? 'edit' : 'new';

  const [mutate] = useMutation(UsersEditUpdateMutation);

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ formApi }) => {
      let result: UsersEdit;

      const updatedFields = getUpdatedFieldValues(formApi);
      const { data } = await mutate({
        variables: {
          selector: { _id: initialData?._id },
          data: updatedFields
        }
      });
      if (!data?.updateUser?.data) {
        throw new Error('Failed to update user');
      }
      result = data.updateUser.data;

      onSuccess(result);
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
      <LegacyFormGroupLayout label={preferredHeadingCase("Prize/Payment Info")} startCollapsed={false}>
        <div className={classes.fieldWrapper}>
          <form.Field name="paymentEmail">
            {(field) => (
              <LWTooltip title="An email you'll definitely check where you can receive information about receiving payments" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Payment Contact Email"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="paymentInfo">
            {(field) => (
              <LWTooltip title="Your PayPal account info, for sending small payments" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="PayPal Info"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              variant={isBookUI() ? 'outlined' : undefined}
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Save
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

export const EditPaymentInfoPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()
  const { flash } = useMessages();
  const navigate = useNavigate();

  if (!currentUser) return <Error404 />
  return <ContentStyles contentType="comment" className={classes.root}>
    <SectionTitle title={`Edit Payment for ${currentUser.displayName}`} />
    <div className={classes.info}>
      <p>To be eligible for prizes and donations through LessWrong, you need a <a href="https://paypal.com/">PayPal account</a>, and to enter your associated PayPal email/info here.</p>
      <p>If you receive more than $600 in a year, you'll need to be entered into Center for Applied Rationality's payment system. CFAR will contact you via your LessWrong email address about next steps. (Make sure it's an email that you check regularly)</p>
    </div>
    <UserPaymentInfoForm
      initialData={currentUser}
      onSuccess={async (user: UsersMinimumInfo | DbUser | null) => {
        flash(`Payment Info for "${userGetDisplayName(user)}" edited`);
        navigate(userGetProfileUrl(user));
      }}
    />
  </ContentStyles>;
}

export default registerComponent('EditPaymentInfoPage', EditPaymentInfoPage);



