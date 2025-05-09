import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { SOCIAL_MEDIA_PROFILE_FIELDS, userCanEditUser, userGetProfileUrl, CAREER_STAGES, PROGRAM_PARTICIPATION } from '../../lib/collections/users/helpers';
import { isEAForum, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_IMPORT_EAG_PROFILE } from '../../lib/cookies/cookies';
import { userHasEagProfileImport } from '../../lib/betas';
import moment from 'moment';
import { isBookUI, isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useGetUserBySlug } from '../hooks/useGetUserBySlug';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { ImageUpload } from '@/components/form-components/ImageUpload';
import { FormComponentFriendlyTextInput } from '../form-components/FormComponentFriendlyTextInput';
import { FormComponentMultiSelect } from '@/components/form-components/FormComponentMultiSelect';
import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { SelectLocalgroup } from '../form-components/SelectLocalgroup';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { useSingle } from '@/lib/crud/withSingle';
import { FormComponentFriendlyDisplayNameInput } from '../form-components/FormComponentFriendlyDisplayNameInput';
import { Error404 } from "../common/Error404";
import { FormGroupFriendlyUserProfile } from "../form-components/FormGroupFriendlyUserProfile";
import { TagMultiselect } from "../form-components/TagMultiselect";
import { PrefixedInput } from "../form-components/PrefixedInput";
import { Typography } from "../common/Typography";
import { ForumIcon } from "../common/ForumIcon";
import { Loading } from "../vulcan-core/Loading";

const styles = defineStyles('EditProfileForm', (theme: ThemeType) => ({
  root: isFriendlyUI
    ? {
      margin: "0 auto",
      maxWidth: 700,
      marginTop: 32,
      fontFamily: theme.palette.fonts.sansSerifStack,
    }
    : {
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
  eagImport: {
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.primary.main,
    background: theme.palette.primaryAlpha(0.05),
    padding: 16,
    margin: "16px 0",
    borderRadius: theme.borderRadius.default,
  },
  importTextDesktop: {
    flexGrow: 1,
    marginLeft: 6,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  importTextMobile: {
    flexGrow: 1,
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
      marginLeft: 6,
    },
  },
  importLink: {
    textDecoration: "underline",
  },
  dismissImport: {
    height: 16,
    cursor: "pointer",
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

  const { mutate } = useUpdate({
    collectionName: 'Users',
    fragmentName: 'UsersEdit',
  });

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
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updateUser.data;

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
      <FormGroupFriendlyUserProfile>
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
              <FormComponentFriendlyDisplayNameInput
                field={field}
                label="Display name"
              />
            )}
          </form.Field>
        </div>
      </FormGroupFriendlyUserProfile>

      <FormGroupFriendlyUserProfile label={preferredHeadingCase("General Info")}>
        <div className={classNames('form-component-FormComponentFriendlyTextInput', classes.fieldWrapper)}>
          <form.Field name="jobTitle">
            {(field) => (
              <FormComponentFriendlyTextInput
                value={field.state.value}
                updateCurrentValue={field.handleChange}
                label="Role"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('form-component-FormComponentFriendlyTextInput', classes.fieldWrapper)}>
          <form.Field name="organization">
            {(field) => (
              <FormComponentFriendlyTextInput
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
      </FormGroupFriendlyUserProfile>

      <FormGroupFriendlyUserProfile label={preferredHeadingCase("About You")}>
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
                value={field.state.value}
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
      </FormGroupFriendlyUserProfile>

      <FormGroupFriendlyUserProfile label={preferredHeadingCase(isFriendlyUI ? "Social Media" : "My Social Media")}>
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
      </FormGroupFriendlyUserProfile>

      <FormGroupFriendlyUserProfile label={preferredHeadingCase("Participation")}>
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
      </FormGroupFriendlyUserProfile>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              variant={isBookUI ? 'outlined' : undefined}
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

const EditProfileFormInner = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()
  const navigate = useNavigate();
  const { params } = useLocation()
  const [cookies, setCookie] = useCookiesWithConsent([
    HIDE_IMPORT_EAG_PROFILE,
  ]);
  let terms: {slug?: string, documentId?: string} = {}
  if (params.slug) {
    terms.slug = params.slug
  } else if (currentUser) {
    terms.documentId = currentUser._id
  }

  const skipSlugLoading = !terms.slug;
  const skipDocumentIdLoading = !terms.documentId;

  const { user: userBySlug, loading: loadingUserBySlug } = useGetUserBySlug(
    terms.slug,
    { fragmentName: 'UsersProfileEdit', skip: skipSlugLoading }
  );

  const { document: userByDocumentId, loading: loadingUserByDocumentId } = useSingle({
    collectionName: 'Users',
    fragmentName: 'UsersProfileEdit',
    documentId: terms.documentId,
    skip: skipDocumentIdLoading,
  });

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

  const showEAGImport = userHasEagProfileImport(currentUser) &&
    cookies[HIDE_IMPORT_EAG_PROFILE] !== "true" &&
    (terms.slug === currentUser.slug || terms.documentId === currentUser._id);

  const dismissEAGImport = () => {
    setCookie(HIDE_IMPORT_EAG_PROFILE, "true", {
      expires: moment().add(30, 'days').toDate(),
      path: "/",
    });
  }

  return (
    <div className={classes.root}>
      <Typography
        variant="display3"
        gutterBottom={!isFriendlyUI}
        className={classes.heading}
      >
        {preferredHeadingCase(isFriendlyUI ? "Edit Profile" : "Edit Public Profile")}
      </Typography>

      {!isEAForum &&
        <div className={classes.subheading}>
          All fields are optional.
        </div>
      }

      {showEAGImport &&
        <div className={classes.eagImport}>
          <span className={classes.importTextDesktop}>
            You can <Link to="/profile/import" className={classes.importLink}>import profile data</Link>
            {" "}from your latest EA Global application.
          </span>
          <span className={classes.importTextMobile}>
            To import EA Global data, please view this page on desktop.
          </span>
          <ForumIcon
            icon="Close"
            onClick={dismissEAGImport}
            className={classes.dismissImport}
          />
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


export const EditProfileForm = registerComponent('EditProfileForm', EditProfileFormInner);


