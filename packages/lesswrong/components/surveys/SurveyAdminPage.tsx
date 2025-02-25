import React, { FormEvent, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useCreate } from "@/lib/crud/withCreate";
import { useMulti } from "@/lib/crud/withMulti";
import { Link } from "@/lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  createSurveyModal: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: 450,
    maxWidth: "100%",
  },
  surveyList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: 16,
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
  secondaryText: {
    color: theme.palette.grey[600],
  },
  error: {
    color: theme.palette.text.error2,
  },
});

const SurveysEditor = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [newSurveyName, setNewSurveyName] = useState("");

  const {
    results: surveys,
    loading: loadingSurveys,
    loadMoreProps: loadMoreSurveysProps,
    refetch: refetchSurveys,
  } = useMulti({
    collectionName: "Surveys",
    fragmentName: "SurveyMinimumInfo",
    terms: {
      view: "surveysByCreatedAt",
    },
  });

  const {
    create: createSurvey,
    loading: loadingCreateSurvey,
    error: createSurveyError,
  } = useCreate({
    collectionName: "Surveys",
    fragmentName: "SurveyMinimumInfo",
  });

  const {
    results: surveySchedules,
    loading: loadingSurveySchedules,
    loadMoreProps: loadMoreSurveySchedulesProps,
  } = useMulti({
    collectionName: "SurveySchedules",
    fragmentName: "SurveyScheduleEdit",
    terms: {
      view: "surveySchedulesByCreatedAt",
    },
  });

  const onOpenCreateSurveyModal = useCallback(() => {
    setShowCreateSurveyModal(true);
  }, []);

  const onCloseCreateSurveyModal = useCallback(() => {
    setShowCreateSurveyModal(false);
  }, []);

  const onCreateSurvey = useCallback(async () => {
    await createSurvey({
      data: {
        name: newSurveyName,
      },
    });
    await refetchSurveys();
    setNewSurveyName("");
    setShowCreateSurveyModal(false);
  }, [createSurvey, refetchSurveys, newSurveyName]);

  const onNewSurveySubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSurveyName.length) {
      void onCreateSurvey();
    }
  }, [newSurveyName, onCreateSurvey]);

  const {
    SingleColumnSection, SectionTitle, Loading, EAButton, FormatDate,
    BlurredBackgroundModal, EAOnboardingInput, LoadMore,
  } = Components;
  return (
    <SingleColumnSection className={classes.root}>

      <SectionTitle title="Surveys" />
      {!!surveys && surveys.length > 0 &&
        <div className={classes.surveyList}>
          {surveys.map(({_id, name, createdAt}) =>
            <div key={_id}>
              <Link
                to={`/survey/${_id}/edit`}
                className={classes.link}
              >
                {name} (<FormatDate date={createdAt} includeAgo />)
              </Link>
            </div>
          )}
        </div>
      }
      {!loadingSurveys && !!surveys && surveys.length < 1 &&
        <div className={classes.secondaryText}>No surveys found</div>
      }
      <div>
        <LoadMore {...loadMoreSurveysProps} />
      </div>
      {loadingSurveys && <div><Loading /></div>}
      <EAButton onClick={onOpenCreateSurveyModal}>
        New survey
      </EAButton>

      <SectionTitle title="Survey schedules" />
      {!!surveySchedules && surveySchedules.length > 0 &&
        <div className={classes.surveyList}>
          {surveySchedules.map(({_id, name, survey, createdAt}) =>
            <div key={_id}>
              <Link
                to={`/surveySchedule/${_id}`}
                className={classes.link}
              >
                {name} ({survey.name}) (<FormatDate date={createdAt} includeAgo />)
              </Link>
            </div>
          )}
        </div>
      }
      {!loadingSurveySchedules && !!surveySchedules && surveySchedules.length < 1 &&
        <div className={classes.secondaryText}>No survey schedules found</div>
      }
      <div>
        <LoadMore {...loadMoreSurveySchedulesProps} />
      </div>
      {loadingSurveySchedules && <div><Loading /></div>}
      <EAButton href="/surveySchedule">
        New survey schedule
      </EAButton>

      <BlurredBackgroundModal
        open={showCreateSurveyModal}
        onClose={onCloseCreateSurveyModal}
        className={classes.createSurveyModal}
      >
        <SectionTitle title="Create survey" noTopMargin />
        <form onSubmit={onNewSurveySubmit}>
          <EAOnboardingInput
            value={newSurveyName}
            setValue={setNewSurveyName}
            placeholder="Survey name"
          />
        </form>
        {createSurveyError &&
          <div className={classes.error}>
            Error: {createSurveyError.message}
          </div>
        }
        <EAButton
          onClick={onCreateSurvey}
          disabled={loadingCreateSurvey || newSurveyName.length < 1}
        >
          {loadingCreateSurvey
            ? <Loading />
            : "Create survey"
          }
        </EAButton>
      </BlurredBackgroundModal>
    </SingleColumnSection>
  );
}

const SurveyAdminPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  return currentUser?.isAdmin
    ? <SurveysEditor classes={classes} />
    : <Components.Error404 />;
}

const SurveyAdminPageComponent = registerComponent(
  "SurveyAdminPage",
  SurveyAdminPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    SurveyAdminPage: typeof SurveyAdminPageComponent
  }
}
