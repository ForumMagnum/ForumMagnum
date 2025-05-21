import React, { useEffect, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { TagSelect } from "@/components/form-components/TagSelect";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentColorPicker } from "@/components/form-components/FormComponentColorPicker";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { EVENT_FORMATS } from "@/lib/collections/forumEvents/types";
import LWTooltip from "../common/LWTooltip";
import Error404 from "../common/Error404";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { withDateFields } from "@/lib/utils/dateUtils";

const ForumEventsEditUpdateMutation = gql(`
  mutation updateForumEventForumEventForm($selector: SelectorInput!, $data: UpdateForumEventDataInput!) {
    updateForumEvent(selector: $selector, data: $data) {
      data {
        ...ForumEventsEdit
      }
    }
  }
`);

const ForumEventsEditMutation = gql(`
  mutation createForumEventForumEventForm($data: CreateForumEventDataInput!) {
    createForumEvent(data: $data) {
      data {
        ...ForumEventsEdit
      }
    }
  }
`);

const ForumEventsEditQuery = gql(`
  query ForumEventForm($documentId: String) {
    forumEvent(input: { selector: { documentId: $documentId } }) {
      result {
        ...ForumEventsEdit
      }
    }
  }
`);

const styles = defineStyles('ForumEventForm', (theme: ThemeType) => ({
  root: {},
  formTitle: {
    marginBottom: -30,
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const InnerForumEventForm = ({
  initialData,
  onSuccess,
}: {
  initialData?: UpdateForumEventDataInput & { _id: string; eventFormat?: DbForumEvent['eventFormat']; customComponent?: DbForumEvent['customComponent']; };
  onSuccess: (doc: ForumEventsEdit) => void;
}) => {
  const classes = useStyles(styles);
  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<ForumEventsEdit>();

  const [create] = useMutation(ForumEventsEditMutation);

  const [mutate] = useMutation(ForumEventsEditUpdateMutation);

  const form = useForm({
    defaultValues: {
      ...initialData,
      customComponent: 'GivingSeason2024Banner' as const,
      startDate: initialData?.startDate ?? new Date(),
      title: initialData?.title ?? '',
    },
    onSubmit: async ({ value, formApi }) => {
      await onSubmitCallback.current?.();

      let result: ForumEventsEdit;

      if (formType === 'new') {
        const { data } = await create({ variables: { data: value } });
        if (!data?.createForumEvent?.data) {
          throw new Error('Failed to create forum event');
        }
        result = data.createForumEvent.data;
      } else {
        const updatedFields = getUpdatedFieldValues(formApi, ['frontpageDescription', 'frontpageDescriptionMobile', 'pollQuestion', 'postPageDescription']);
        const { data } = await mutate({
          variables: {
            selector: { _id: initialData?._id },
            data: updatedFields
          }
        });
        if (!data?.updateForumEvent?.data) {
          throw new Error('Failed to update forum event');
        }
        result = data.updateForumEvent.data;
      }

      onSuccessCallback.current?.(result);

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
      <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="frontpageDescription">
          {(field) => (
            <EditorFormComponent
              field={field}
              name="frontpageDescription"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(forumEvent) => {
                return {
                  id: `forumEvent:frontpageDescription:${forumEvent?._id ?? "create"}`,
                  verify: true,
                };
              }}
              hintText={defaultEditorPlaceholder}
              fieldName="frontpageDescription"
              collectionName="ForumEvents"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
            />
          )}
        </form.Field>
      </div>

      <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="frontpageDescriptionMobile">
          {(field) => (
            <EditorFormComponent
              field={field}
              name="frontpageDescriptionMobile"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(forumEvent) => {
                return {
                  id: `forumEvent:frontpageDescriptionMobile:${forumEvent?._id ?? "create"}`,
                  verify: true,
                };
              }}
              hintText={defaultEditorPlaceholder}
              fieldName="frontpageDescriptionMobile"
              collectionName="ForumEvents"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
            />
          )}
        </form.Field>
      </div>

      <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="postPageDescription">
          {(field) => (
            <EditorFormComponent
              field={field}
              name="postPageDescription"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(forumEvent) => {
                return {
                  id: `forumEvent:postPageDescription:${forumEvent?._id ?? "create"}`,
                  verify: true,
                };
              }}
              hintText={defaultEditorPlaceholder}
              fieldName="postPageDescription"
              collectionName="ForumEvents"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="title">
          {(field) => (
            <MuiTextField
              field={field}
              label="Title"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="startDate">
          {(field) => (
            <FormComponentDatePicker
              field={field}
              below={true}
              label="Start date"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="endDate">
          {(field) => (
            <FormComponentDatePicker
              field={field}
              below={true}
              label="End date"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="darkColor">
          {(field) => (
            <LWTooltip title={`Used as the background of the banner for basic events. Sometimes used as a text color with "Secondary background color" ("lightColor" in the schema) as the background, so these should be roughly inverses of each other.`} placement="left-start" inlineBlock={false}>
              <FormComponentColorPicker
                field={field}
                label="Primary background color"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="lightColor">
          {(field) => (
            <LWTooltip title={`Used as the background in some places (e.g. topic tabs) with "Primary background color" as the foreground, so these should be roughly inverses of each other.`} placement="left-start" inlineBlock={false}>
              <FormComponentColorPicker
                field={field}
                label="Secondary background color"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="bannerTextColor">
          {(field) => (
            <LWTooltip title={`Color of the text on the main banner, and for some event types the text in the header (e.g. "Effective Altruism Forum"). For many events its ok to leave this as white, it may be useful to set for events where the primary background color is light.`} placement="left-start" inlineBlock={false}>
              <FormComponentColorPicker
                field={field}
                label="Banner text color"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="contrastColor">
          {(field) => (
            <FormComponentColorPicker
              field={field}
              label="Accent color (optional, used very rarely)"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="tagId">
          {(field) => (
            <TagSelect
              field={field}
              label="Choose tag"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="postId">
          {(field) => (
            <MuiTextField
              field={field}
              label="Choose post ID"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="bannerImageId">
          {(field) => (
            <ImageUpload
              field={field}
              label="Banner image ID"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="eventFormat">
          {(field) => (
            <FormComponentSelect
              field={field}
              options={EVENT_FORMATS.map((format) => ({
                value: format,
                label: format,
              }))}
              label="Event format"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="pollQuestion">
          {(field) => (
            <EditorFormComponent
              field={field}
              name="pollQuestion"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(forumEvent) => {
                return {
                  id: `forumEvent:pollQuestion:${forumEvent?._id ?? "create"}`,
                  verify: true,
                };
              }}
              hintText="Write the poll question as plain text (no headings), footnotes will appear as tooltips on the frontpage"
              fieldName="pollQuestion"
              collectionName="ForumEvents"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="customComponent">
          {(field) => (
            <MuiTextField
              field={field}
              label="Custom component"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="commentPrompt">
          {(field) => (
            <LWTooltip title={`For events with comments, the title in the comment box (defaults to "Add your comment")`} placement="left-start" inlineBlock={false}>
              <MuiTextField
                field={field}
                label="Comment prompt"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div >

      <LegacyFormGroupLayout label={`"POLL" Event Options`} startCollapsed={true} >
        <div className={classes.fieldWrapper}>
          <form.Field name="pollAgreeWording">
            {(field) => (
              <MuiTextField
                field={field}
                label="Poll agree wording"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="pollDisagreeWording">
            {(field) => (
              <MuiTextField
                field={field}
                label="Poll disagree wording"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

      <LegacyFormGroupLayout label={`"STICKER" Event Options`} startCollapsed={true} >
        <div className={classes.fieldWrapper}>
          <form.Field name="maxStickersPerUser">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Max stickers per user"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout >

      < div className="form-submit" >
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
      </div >
    </form >
  );
};

export const ForumEventForm = ({ documentId }: {
  documentId?: string,
}) => {
  const classes = useStyles(styles);

  const title = documentId ? "Edit forum event" : "New forum event";
  const [remountingForm, setRemountingForm] = useState(false);

  const { loading, data } = useQuery(ForumEventsEditQuery, {
    variables: { documentId: documentId },
    skip: !documentId,
  });
  const editableDocument = data?.forumEvent?.result ?? undefined;

  useEffect(() => {
    if (remountingForm) {
      setRemountingForm(false);
    }
  }, [remountingForm])

  if (documentId && loading) {
    return <Loading />;
  }

  const loadingExistingEvent = documentId && loading;

  const initialData = withDateFields(editableDocument, ['startDate', 'endDate']);

  return (
    <div className={classes.root}>
      <SectionTitle title={title} titleClassName={classes.formTitle} />
      {loadingExistingEvent && <Loading />}
      {!remountingForm && !loadingExistingEvent && <InnerForumEventForm
        initialData={initialData}
        onSuccess={() => setRemountingForm(true)}
      />}
    </div>
  );
}

export default registerComponent(
  "ForumEventForm",
  ForumEventForm,
);


