import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { DialogContent } from "@/components/widgets/DialogContent";
import { useNavigate } from '../../lib/routeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useForm } from '@tanstack/react-form';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { useSingle } from '@/lib/crud/withSingle';
import { FormComponentCheckbox } from '@/components/form-components/FormComponentCheckbox';
import { localGroupTypeFormOptions, GROUP_CATEGORIES } from '@/lib/collections/localgroups/groupTypes';
import { isEAForum, isLW } from '@/lib/instanceSettings';
import { MultiSelectButtons } from '@/components/form-components/MultiSelectButtons';
import { FormComponentMultiSelect } from '@/components/form-components/FormComponentMultiSelect';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
import { FormUserMultiselect } from '@/components/form-components/UserMultiselect';
import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { ImageUpload } from '@/components/form-components/ImageUpload';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { useCreate } from '@/lib/crud/withCreate';
import { useUpdate } from '@/lib/crud/withUpdate';
import { GroupFormSubmit } from './GroupFormSubmit';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';

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
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
}));

const TanStackGroupForm = ({
  initialData,
  isOnline: initialIsOnline,
  currentUser,
  onSuccess,
}: {
  initialData?: localGroupsEdit;
  isOnline?: boolean;
  currentUser: UsersCurrent;
  onSuccess: (group: any) => void;
}) => {
  const classes = useStyles(styles);

  const { LWTooltip, Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<localGroupsHomeFragment>();

  const { create } = useCreate({
    collectionName: 'Localgroups',
    fragmentName: 'localGroupsHomeFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Localgroups',
    fragmentName: 'localGroupsHomeFragment',
  });
  
  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      types: initialData?.types ?? ["LW"],
      categories: initialData?.categories ?? [],
      isOnline: initialIsOnline ?? initialData?.isOnline ?? false,
      organizerIds: initialData ? initialData.organizerIds : [currentUser._id],
      bannerImageId: initialData?.bannerImageId ?? null,
      deleted: initialData?.deleted ?? false,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: localGroupsHomeFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createLocalgroup.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateLocalgroup.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess(result);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className='vulcan-form' onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <div className={classes.fieldWrapper}>
        <form.Field name="name">
          {(field) => (
            <MuiTextField
              field={field}
              label="Group Name"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="nameInAnotherLanguage">
          {(field) => (
            <MuiTextField
              field={field}
              label="Group name in another language (optional)"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="organizerIds">
          {(field) => (
            <FormUserMultiselect
              field={field}
              label={preferredHeadingCase("Add Organizers")}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="contents">
          {(field) => (
            <EditorFormComponent
              field={field}
              fieldName='contents'
              name='contents'
              commentEditor
              commentStyles
              collectionName='Localgroups'
              formType={formType}
              document={form.state.values}
              hintText='Short description'
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
            />
          )}
        </form.Field>
      </div>

      {isLW && <div className={classes.fieldWrapper}>
        <form.Field name="types">
          {(field) => (
            <MultiSelectButtons
              field={field}
              label='Group Type:'
              options={localGroupTypeFormOptions}
            />
          )}
        </form.Field>
      </div>}

      {isEAForum && <div className={classes.fieldWrapper}>
        <form.Field name="categories">
          {(field) => (
            <FormComponentMultiSelect
              field={field}
              label='Group type / intended audience:'
              options={GROUP_CATEGORIES}
              placeholder='Select all that apply'
            />
          )}
        </form.Field>
      </div>}

      <div className={classes.fieldWrapper}>
        <form.Field name="isOnline">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="This is an online group"
            />
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.values.isOnline]}>
        {([isOnline]) => {
          if (isOnline) {
            return null;
          }

          return <div className={classes.fieldWrapper}>
            <form.Field name="googleLocation">
              {(field) => (
                <LocationFormComponent
                  field={field}
                  label={isFriendlyUI ? "Group location" : "Group Location"}
                />
              )}
            </form.Field>
          </div>;
        }}
      </form.Subscribe>

      <div className={classes.fieldWrapper}>
        <form.Field name="contactInfo">
          {(field) => (
            <MuiTextField
              field={field}
              label="Contact Info"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="facebookLink">
          {(field) => (
            <MuiTextField
              field={field}
              label="Facebook Group"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="facebookPageLink">
          {(field) => (
            <MuiTextField
              field={field}
              label="Facebook Page"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="meetupLink">
          {(field) => (
            <MuiTextField
              field={field}
              label="Meetup.com Group"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="slackLink">
          {(field) => (
            <MuiTextField
              field={field}
              label="Slack Workspace"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="website">
          {(field) => (
            <MuiTextField
              field={field}
              label="Website"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="bannerImageId">
          {(field) => (
            <LWTooltip inlineBlock={false} placement="left-start" title='Recommend 1640x856 px, 1.91:1 aspect ratio (same as Facebook)'>
              <ImageUpload
                field={field}
                label={isFriendlyUI ? "Banner image" : "Banner Image"}
                croppingAspectRatio={1.91}
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      {/* Made a deliberate choice to get rid of the form group surrounding this single field */}
      {formType === 'edit' && userIsAdminOrMod(currentUser) && (
        <div className={classes.fieldWrapper}>
          <form.Field name="deleted">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Delete Group"
              />
            )}
          </form.Field>
        </div>
      )}

      {/* <div className={classes.formSubmit}> */}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <GroupFormSubmit
              formApi={form}
              document={form.state.values}
              formType={formType}
            />
          )}
        </form.Subscribe>
      {/* </div> */}
    </form>
  );
};

const GroupFormDialog = ({ onClose, documentId, isOnline }: {
  onClose: () => void,
  documentId?: string,
  isOnline?: boolean
}) => {
  const { LWDialog, Loading } = Components;
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  const classes = useStyles(styles);

  const { document: initialData, loading } = useSingle({
    documentId,
    collectionName: 'Localgroups',
    fragmentName: 'localGroupsEdit',
    skip: !documentId,
  });

  const handleSuccess = (group: localGroupsHomeFragment) => {
    onClose();
    if (documentId) {
      flash({ messageString: "Successfully edited local group " + group.name });
    } else {
      flash({ messageString: "Successfully created new local group " + group.name });
      navigate({ pathname: '/groups/' + group._id });
    }
  };

  if (loading && documentId) {
    return <Loading />;
  }

  return <LWDialog
    open={true}
    onClose={onClose}
  >
    <DialogContent className={classes.localGroupForm}>
      <TanStackGroupForm
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

