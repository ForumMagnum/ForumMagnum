import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { Link } from "@/lib/reactRouterWrapper";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import { useStyles, defineStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { surveyScheduleTargets } from "@/lib/collections/surveySchedules/constants";
import { useSingle } from "@/lib/crud/withSingle";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { z } from "zod";

const styles = defineStyles('SurveyScheduleEditPage', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingTop: 30,
  },
  surveyAdmin: {
    color: theme.palette.primary.main,
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const SurveySchedulesForm = ({
  initialData,
  onSuccess,
}: {
  initialData?: Required<Omit<UpdateSurveyScheduleDataInput, 'clientIds' | 'legacyData'>> & { _id?: string; target?: DbSurveySchedule['target'] };
  onSuccess: (doc: SurveyScheduleEdit) => void;
}) => {
  const { LWTooltip, Error404, FormComponentCheckbox } = Components;
  const classes = useStyles(styles);

  const formType = initialData ? 'edit' : 'new';

  const { create } = useCreate({
    collectionName: 'SurveySchedules',
    fragmentName: 'SurveyScheduleEdit',
  });

  const { mutate } = useUpdate({
    collectionName: 'SurveySchedules',
    fragmentName: 'SurveyScheduleEdit',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues = {
    ...(initialData ?? { target: 'allUsers', startDate: null, endDate: null, deactivated: null } as const),
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        let result: SurveyScheduleEdit;

        if (formType === 'new') {
          const { data } = await create({ data: value });
          result = data?.createSurveySchedule.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateSurveySchedule.data;
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
      <div className={classes.fieldWrapper}>
        <form.Field name="surveyId">
          {(field) => (
            <MuiTextField
              field={field}
              label="Survey ID"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="name">
          {(field) => (
            <MuiTextField
              field={field}
              label="Schedule name"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="impressionsLimit" validators={{ onChange: z.number().min(0).nullable() }}>
          {(field) => (
            <LWTooltip title="The maximum number of visitors who'll see this survey" placement="left-start" inlineBlock={false}>
              <MuiTextField
                field={field}
                type="number"
                label="Impressions limit"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="maxVisitorPercentage" validators={{ onChange: z.number().min(0).max(100).nullable() }}>
          {(field) => (
            <LWTooltip title="The maximum percentage of visitors this survey will be shown to" placement="left-start" inlineBlock={false}>
              <MuiTextField
                field={field}
                type="number"
                label="Max visitor percentage"
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="minKarma">
          {(field) => (
            <MuiTextField
              field={field}
              type="number"
              label="Min karma"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="maxKarma">
          {(field) => (
            <MuiTextField
              field={field}
              type="number"
              label="Max karma"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="target">
          {(field) => (
            <FormComponentSelect
              field={field}
              options={surveyScheduleTargets}
              hideClear={true}
              label="Target"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="startDate">
          {(field) => (
            <FormComponentDatePicker
              field={field}
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
              label="End date"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="deactivated">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Deactivated"
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
  );
};

const SurveyScheduleEditor = () => {
  const classes = useStyles(styles);
  const { params: { id } } = useLocation();
  const navigate = useNavigate();
  const isNewForm = !id;

  const { document: initialData } = useSingle({
    collectionName: 'SurveySchedules',
    fragmentName: 'SurveyScheduleEdit',
    documentId: id,
    skip: isNewForm,
  });

  const onCreate = useCallback(() => {
    navigate("/admin/surveys");
  }, [navigate]);

  const { SingleColumnSection, SectionTitle } = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <Link to="/admin/surveys" className={classes.surveyAdmin}>
        &lt;- Back to survey admin
      </Link>
      <SectionTitle title={`${isNewForm ? "New" : "Edit"} survey schedule`} />
      <SurveySchedulesForm
        initialData={initialData}
        onSuccess={onCreate}
      />
    </SingleColumnSection>
  );
}

const SurveyScheduleEditPage = () => {
  const currentUser = useCurrentUser();
  return currentUser?.isAdmin
    ? <SurveyScheduleEditor />
    : <Components.Error404 />;
}

const SurveyScheduleEditPageComponent = registerComponent(
  "SurveyScheduleEditPage",
  SurveyScheduleEditPage,
);

declare global {
  interface ComponentTypes {
    SurveyScheduleEditPage: typeof SurveyScheduleEditPageComponent
  }
}
