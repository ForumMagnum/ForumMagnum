/* eslint-disable react/no-children-prop */
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import { useNavigate } from '../../lib/routeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useAppForm } from '../tanstack-form-components/BaseAppForm';
import { useForm } from '@tanstack/react-form';
// import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
// import Box from '@/lib/vendor/@material-ui/core/src/Card';
// import { UserType } from '@/lib/users/types';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TanStackMuiTextField } from '../tanstack-form-components/TanStackMuiTextField';
import { useSingle } from '@/lib/crud/withSingle';

const styles = defineStyles('GroupFormDialog', (theme: ThemeType) => ({
  localGroupForm: {
    "& div": {
      fontFamily: theme.typography.fontFamily,
    },
    "& .editor": {
      minHeight: 50,
      fontSize: "1.1rem",
      position: "relative",
    },
    "& .form-submit": {
      marginTop: 10,
      textAlign: "right",
    },
    "& .form-component-select": {
      "& .col-sm-9": {
        width: "100%",
        padding: 0,
      },
      "& label": {
        display: "none",
      },
      "& .form-component-clear": {
        display: "none"
      },
    },
  },
  fieldWrapper: {
    marginBottom: theme.spacing.unit * 2,
  },
}));

const groupValidationSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  nameInAnotherLanguage: z.string().nullable(),
  organizerIds: z.array(z.string()).min(1, "At least one organizer is required"),
  types: z.array(z.string()).min(1, "At least one group type is required"),
  categories: z.array(z.string()).or(z.undefined()),
  isOnline: z.boolean().default(false),
  googleLocation: z.any().optional(),
  location: z.string().optional(),
  contents: z.any().optional(),
  contactInfo: z.string().optional(),
  facebookLink: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal('')),
  facebookPageLink: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal('')),
  meetupLink: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal('')),
  slackLink: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal('')),
  website: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal('')),
  bannerImageId: z.string().optional(),
  deleted: z.boolean().optional(),
});

type GroupFormValues = z.infer<typeof groupValidationSchema>;

const TanStackGroupForm = ({
  documentId,
  initialData,
  isOnline: initialIsOnline,
  currentUser,
  onSuccess,
}: {
  documentId?: string;
  initialData?: Omit<localGroupsEdit, '_id' | 'createdAt' | 'organizers' | 'lastActivity' | 'deleted' | 'mongoLocation' | 'inactive'>;
  isOnline?: boolean;
  currentUser: UsersCurrent;
  onSuccess: (group: any) => void;
}) => {
  const classes = useStyles(styles);

  const form = useForm({
    validators: {
      onChange: groupValidationSchema,
    },
    // validatorAdapter: zodValidator,
    defaultValues: initialData,
    // defaultValues: {
    //   name: initialData?.name ?? '',
    //   // nameInAnotherLanguage: initialData?.nameInAnotherLanguage ?? undefined, // ?? '',
    //   organizerIds: initialData?.organizerIds ?? (currentUser?._id ? [currentUser._id] : []),
    //   types: initialData?.types ?? ['LW'],
    //   ...(initialData?.categories ? { categories: initialData.categories } : {}),
    //   // categories: initialData?.categories ?? undefined,
    //   isOnline: initialData?.isOnline ?? initialIsOnline ?? false,
    //   googleLocation: initialData?.googleLocation ?? null,
    //   location: initialData?.location ?? '',
    //   // contents: initialData?.contents?.database ?? null,
    //   contactInfo: initialData?.contactInfo ?? '',
    //   facebookLink: initialData?.facebookLink ?? '',
    //   facebookPageLink: initialData?.facebookPageLink ?? '',
    //   meetupLink: initialData?.meetupLink ?? '',
    //   slackLink: initialData?.slackLink ?? '',
    //   website: initialData?.website ?? '',
    //   bannerImageId: initialData?.bannerImageId ?? '',
    //   deleted: initialData?.deleted ?? false,
    // } satisfies GroupFormValues,
    onSubmit: async ({ value }) => {
      console.log('Form Submitted:', value);
      const mockResult = { ...value, _id: documentId || 'new-id-' + Date.now(), name: value.name };
      onSuccess(mockResult);
    },
  });

  // const isOnline = form.store.useStore(state => state.values.isOnline);


  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }}>
      <div className={classes.fieldWrapper}>
        <form.Field
          name="name"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Group Name"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="nameInAnotherLanguage"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Group name in another language (optional)"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="organizerIds"
          children={(field) => (
            <div>TODO: Replace with TanStackFormUserMultiselect for 'organizerIds'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="types"
          children={(field) => (
            <div>TODO: Replace with TanStackMultiSelectButtons for 'types'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="categories"
          children={(field) => (
            <div>TODO: Replace with TanStackFormComponentMultiSelect for 'categories'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="isOnline"
          children={(field) => (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  onBlur={field.handleBlur}
                />
                {'This is an online group'}
              </label>
              {field.state.meta.errors?.[0] && <p style={{ color: 'red' }}>{field.state.meta.errors[0]}</p>}
            </div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="googleLocation"
          children={(field) => (
            <div>TODO: Replace with TanStackLocationForm for 'googleLocation'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="contents"
          children={(field) => (
            <div>TODO: Replace with TanStackEditorForm for 'contents'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="contactInfo"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Contact Info"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="facebookLink"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Facebook Group"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="facebookPageLink"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Facebook Page"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="meetupLink"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Meetup.com Group"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="slackLink"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Slack Workspace"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="website"
          children={(field) => (
            <TanStackMuiTextField
              field={field}
              label="Website"
              fullWidth
            />
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="bannerImageId"
          children={(field) => (
            <div>TODO: Replace with TanStackImageUpload for 'bannerImageId'</div>
          )}
        />
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field
          name="deleted"
          children={(field) => (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  onBlur={field.handleBlur}
                />
                Delete Group
              </label>
              {field.state.meta.errors?.[0] && <p style={{ color: 'red' }}>{field.state.meta.errors[0]}</p>}
            </div>
          )}
        />
      </div>

      <div className={classes.formSubmit}>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (documentId ? 'Update Group' : 'Create Group')}
            </Button>
          )}
        />
      </div>
    </form>
  );
};

const GroupFormDialog = ({ onClose, documentId, isOnline }: {
  onClose: () => void,
  documentId?: string,
  isOnline?: boolean
}) => {
  const { LWDialog } = Components;
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const classes = useStyles(styles);
  
  const { document: initialData } = useSingle({
    documentId,
    collectionName: 'Localgroups',
    fragmentName: 'localGroupsEdit',
    skip: !documentId,
  });

  // const initialData: Partial<DbLocalgroup> | undefined = documentId ? { name: "Fetched Group Name" } : undefined;
  const isLoading = false;

  const handleSuccess = (group: any) => {
    onClose();
    if (documentId) {
      flash({ messageString: "Successfully edited local group " + group.name });
    } else {
      flash({ messageString: "Successfully created new local group " + group.name });
      navigate({ pathname: '/groups/' + group._id });
    }
  };

  if (documentId && isLoading) {
    return (
      <LWDialog open={true} onClose={onClose}>
        <DialogContent>Loading group data...</DialogContent>
      </LWDialog>
    );
  }

  return <LWDialog
    open={true}
    onClose={onClose}
  >
    <DialogContent className={classes.localGroupForm}>
      <TanStackGroupForm
        documentId={documentId}
        initialData={initialData}
        isOnline={isOnline}
        currentUser={currentUser!}
        onSuccess={handleSuccess}
      />
    </DialogContent>
  </LWDialog>
}

const GroupFormDialogComponent = registerComponent('GroupFormDialog', GroupFormDialog);

declare global {
  interface ComponentTypes {
    GroupFormDialog: typeof GroupFormDialogComponent
  }
}

