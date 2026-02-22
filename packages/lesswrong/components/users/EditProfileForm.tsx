import { FormComponentMultiSelect } from '@/components/form-components/FormComponentMultiSelect';
import { ImageUpload } from '@/components/form-components/ImageUpload';
import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { useMutation } from "@apollo/client/react";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { CAREER_STAGES, PROGRAM_PARTICIPATION, SOCIAL_MEDIA_PROFILE_FIELDS, userCanEditUser, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { taggingNamePluralSetting } from '../../lib/instanceSettings';
import { Link } from "../../lib/reactRouterWrapper";
import { useNavigate } from "../../lib/routeUtil";
import Error404 from "../common/Error404";
import { Typography } from "../common/Typography";
import { useCurrentUser } from '../common/withUser';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { FormComponentDisplayNameInput } from '../form-components/FormComponentDisplayNameInput';
import { FormComponentTextInput } from '../form-components/FormComponentTextInput';
import FormGroupUserProfile from "../form-components/FormGroupUserProfile";
import PrefixedInput from "../form-components/PrefixedInput";
import { SelectLocalgroup } from '../form-components/SelectLocalgroup';
import TagMultiselect from "../form-components/TagMultiselect";
import { defineStyles, useStyles } from '../hooks/useStyles';
import Loading from "../vulcan-core/Loading";

const UsersEditUpdateMutation = gql(`
  mutation updateUserEditProfileForm($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

const UsersProfileEditQuery = gql(`
  query EditProfileForm($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersProfileEdit
      }
    }
  }
`);

const GetUserBySlugQuery = gql(`
  query EditProfileFormGetUserBySlug($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersProfileEdit
    }
  }
`);

const styles = defineStyles('EditProfileForm', (theme: ThemeType) => ({
  root: {
          margin: "0 auto",
          maxWidth: 800,
        },
  heading: {
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  subheading: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    marginBottom: 40
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  noTopFieldWrapper: {
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  profileTagsMessage: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    marginTop: 8,
    color: theme.palette.greyAlpha(1),
    textTransform: "none",
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 700,
      "&:hover": {
        color: theme.palette.primary.light,
      },
    },
  },
  topOfFormMargin: {
    marginBottom: 32,
  }
}));

const urlFields = ["linkedinProfileURL", "facebookProfileURL", "blueskyProfileURL", "twitterProfileURL", "githubProfileURL"] as const;

type ProfileFormFields =
| 'displayName'
| 'profileImageId'
| 'jobTitle'
| 'organization'
| 'careerStage'
| 'mapLocation'
| 'website'
| 'biography'
| 'howOthersCanHelpMe'
| 'howICanHelpOthers'
| 'linkedinProfileURL'
| 'facebookProfileURL'
| 'blueskyProfileURL'
| 'twitterProfileURL'
| 'githubProfileURL'
| 'profileTagIds'
| 'organizerOfGroupIds'
| 'programParticipation';

const UserProfileForm = ({
  initialData,
  onSuccess,
}: {
  initialData: Pick<UpdateUserDataInput, ProfileFormFields> & { _id: string };
  onSuccess: (doc: UsersEdit) => void;
}) => {
  const classes = useStyles(styles);

  const formType = 'edit';

  const {
    onSubmitCallback: onSubmitBiographyCallback,
    onSuccessCallback: onSuccessBiographyCallback,
    addOnSubmitCallback: addOnSubmitBiographyCallback,
    addOnSuccessCallback: addOnSuccessBiographyCallback
  } = useEditorFormCallbacks<UsersEdit>();

  const {
    onSubmitCallback: onSubmitHowOthersCanHelpMeCallback,
    onSuccessCallback: onSuccessHowOthersCanHelpMeCallback,
    addOnSubmitCallback: addOnSubmitHowOthersCanHelpMeCallback,
    addOnSuccessCallback: addOnSuccessHowOthersCanHelpMeCallback
  } = useEditorFormCallbacks<UsersEdit>();

  const {
    onSubmitCallback: onSubmitHowICanHelpOthersCallback,
    onSuccessCallback: onSuccessHowICanHelpOthersCallback,
    addOnSubmitCallback: addOnSubmitHowICanHelpOthersCallback,
    addOnSuccessCallback: addOnSuccessHowICanHelpOthersCallback
  } = useEditorFormCallbacks<UsersEdit>();

  const sharedEditableFieldProps = {
    collectionName: "Users",
    formType,
    commentEditor: true,
    commentStyles: true,
    hideControls: false,
    formVariant: "grey",
  } as const;

  const [mutate] = useMutation(UsersEditUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ formApi }) => {
      await Promise.all([
        onSubmitBiographyCallback.current?.(),
        onSubmitHowOthersCanHelpMeCallback.current?.(),
        onSubmitHowICanHelpOthersCallback.current?.(),
      ]);

      try {
        let result: UsersEdit;

        const updatedFields = getUpdatedFieldValues(formApi, ['biography', 'howOthersCanHelpMe', 'howICanHelpOthers']);
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

        onSuccessBiographyCallback.current?.(result);
        onSuccessHowOthersCanHelpMeCallback.current?.(result);
        onSuccessHowICanHelpOthersCallback.current?.(result);

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
      <div className={classes.topOfFormMargin} />
      <FormGroupUserProfile>
        <div className={classes.fieldWrapper}>
          <form.Field name="profileImageId">
            {(field) => (
              <ImageUpload
                field={field}
                label="Profile Image"
                horizontal
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="displayName">
            {(field) => (
              <FormComponentDisplayNameInput
                field={field}
                label="Display name"
              />
            )}
          </form.Field>
        </div>
      </FormGroupUserProfile>

      <FormGroupUserProfile label={preferredHeadingCase("General Info")}>
        <div className={classNames('form-component-FormComponentTextInput', classes.fieldWrapper)}>
          <form.Field name="jobTitle">
            {(field) => (
              <FormComponentTextInput
                value={field.state.value}
                updateCurrentValue={field.handleChange}
                label="Role"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('form-component-FormComponentTextInput', classes.fieldWrapper)}>
          <form.Field name="organization">
            {(field) => (
              <FormComponentTextInput
                value={field.state.value}
                updateCurrentValue={field.handleChange}
                label="Organization"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="careerStage">
            {(field) => (
              <FormComponentMultiSelect
                field={field}
                options={CAREER_STAGES}
                label="Career stage"
                placeholder="Select all that apply"
                variant="grey"
                separator=", "
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="mapLocation">
            {(field) => (
              <LocationFormComponent
                field={field}
                label="Location"
                variant="grey"
              />
            )}
          </form.Field>
        </div>
      </FormGroupUserProfile>

      <FormGroupUserProfile label={preferredHeadingCase("About You")}>
        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="biography">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="biography"
                fieldName="biography"
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitBiographyCallback}
                addOnSuccessCallback={addOnSuccessBiographyCallback}
                label="Bio"
                hintText="Tell us about yourself"
                {...sharedEditableFieldProps}
              />
            )}
          </form.Field>
        </div>

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="howOthersCanHelpMe">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="howOthersCanHelpMe"
                fieldName="howOthersCanHelpMe"
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitHowOthersCanHelpMeCallback}
                addOnSuccessCallback={addOnSuccessHowOthersCanHelpMeCallback}
                label="How others can help me"
                hintText="Ex: I am looking for opportunities to do..."
                {...sharedEditableFieldProps}
              />
            )}
          </form.Field>
        </div>

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="howICanHelpOthers">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="howICanHelpOthers"
                fieldName="howICanHelpOthers"
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitHowICanHelpOthersCallback}
                addOnSuccessCallback={addOnSuccessHowICanHelpOthersCallback}
                label="How I can help others"
                hintText="Ex: Reach out to me if you have questions about..."
                {...sharedEditableFieldProps}
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="profileTagIds">
            {(field) => (
              <TagMultiselect
                value={field.state.value ?? []}
                updateCurrentValues={(values) => field.handleChange(values)}
                label={<>
                  {"Interests"}
                  <div className={classes.profileTagsMessage}>
                    These are visible on your profile.{" "}
                    If you want to subscribe to topics, go{" "}
                    <Link to="/manageSubscriptions">here</Link>.
                  </div>
                </>}
                placeholder={`Search for ${taggingNamePluralSetting.get()}`}
                variant="grey"
              />
            )}
          </form.Field>
        </div>
      </FormGroupUserProfile>

      <FormGroupUserProfile label={preferredHeadingCase("My Social Media")}>
        {urlFields.map((urlFieldName, idx) => (
          <div className={classes.fieldWrapper} key={idx}>
            <form.Field name={urlFieldName}>
              {(field) => {
                const isFirstField = idx === 0;
                const isNotLastField = idx !== urlFields.length - 1;

                const headingProp = isFirstField ? { heading: "Social media" } : {};
                const smallBottomMarginProp = isNotLastField ? { smallBottomMargin: true } : {};

                return <PrefixedInput
                  field={field}
                  inputPrefix={SOCIAL_MEDIA_PROFILE_FIELDS[urlFieldName]}
                  {...headingProp}
                  {...smallBottomMarginProp}
                />;
              }}
            </form.Field>
          </div>
        ))}

        <div className={classes.fieldWrapper}>
          <form.Field name="website">
            {(field) => (
              <PrefixedInput
                field={field}
                inputPrefix="https://"
                heading="Website"
              />
            )}
          </form.Field>
        </div>
      </FormGroupUserProfile>

      <FormGroupUserProfile label={preferredHeadingCase("Participation")}>
        <div className={classes.noTopFieldWrapper}>
          <form.Field name="organizerOfGroupIds">
            {(field) => (
              <SelectLocalgroup
                field={field}
                document={form.state.values}
                useDocumentAsUser={true}
                label="Organizer of"
                placeholder="Select groups to display"
                variant="grey"
                separator=", "
                multiselect={true}
                hideClear={true}
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="programParticipation">
            {(field) => (
              <FormComponentMultiSelect
                field={field}
                options={PROGRAM_PARTICIPATION}
                label="Program participation"
                placeholder="Which of these programs have you participated in?"
                variant="grey"
                separator=", "
              />
            )}
          </form.Field>
        </div>
      </FormGroupUserProfile>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              variant="outlined"
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

const EditProfileForm = ({slug}: {slug: string}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()
  const navigate = useNavigate();
  let terms: {slug?: string, documentId?: string} = {}
  if (slug) {
    terms.slug = slug
  } else if (currentUser) {
    terms.documentId = currentUser._id
  }

  const skipSlugLoading = !terms.slug;
  const skipDocumentIdLoading = !terms.documentId;

  const { data: userBySlugData, loading: loadingUserBySlug } = useQuery(GetUserBySlugQuery, {
    variables: { slug: terms.slug ?? '' },
    skip: skipSlugLoading,
  });

  const userBySlug = userBySlugData?.GetUserBySlug;

  const { loading: loadingUserByDocumentId, data } = useQuery(UsersProfileEditQuery, {
    variables: { documentId: terms.documentId },
    skip: skipDocumentIdLoading,
  });
  const userByDocumentId = data?.user?.result;

  const formUser = terms.slug ? userBySlug : userByDocumentId;

  // no matching user
  if ((!terms.slug && !terms.documentId) || !currentUser) {
    return (
      <div className={classes.root}>
        Log in to edit your profile
      </div>
    );
  }
  // current user doesn't have edit permission
  const userInfo = terms.documentId ? {_id: terms.documentId} : terms.slug ? {slug: terms.slug} : null;
  if (!userInfo || !userCanEditUser(currentUser, userInfo)) {
    return <div className={classes.root}>
      Sorry, you do not have permission to do this at this time.
    </div>
  }

  return (
    <div className={classes.root}>
      <Typography
        variant="display3"
        gutterBottom={true}
        className={classes.heading}
      >
        {preferredHeadingCase("Edit Public Profile")}
      </Typography>

      {<div className={classes.subheading}>
                    All fields are optional.
                  </div>
      }

      {(!skipSlugLoading && loadingUserBySlug) && <Loading />}
      {(!skipDocumentIdLoading && loadingUserByDocumentId) && <Loading />}
      {(formUser) && (
        <UserProfileForm
          initialData={formUser}
          onSuccess={(user) => {
            navigate(userGetProfileUrl(user))
          }}
        />
      )}
    </div>
  )
}


export default EditProfileForm;
