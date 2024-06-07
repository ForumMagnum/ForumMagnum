import React, { FormEvent, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "@/lib/crud/withMulti";
import { useCreate } from "@/lib/crud/withCreate";
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
    display: "block",
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

  const {results: surveys, loading: loadingSurveys, refetch} = useMulti({
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
    await refetch();
    setNewSurveyName("");
    setShowCreateSurveyModal(false);
  }, [createSurvey, refetch, newSurveyName]);

  const onNewSurveySubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSurveyName.length) {
      void onCreateSurvey();
    }
  }, [newSurveyName, onCreateSurvey]);

  const {
    SingleColumnSection, SectionTitle, Loading, EAButton, FormatDate,
    BlurredBackgroundModal, EAOnboardingInput,
  } = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <SectionTitle title="Surveys" />
      {!!surveys && surveys.length > 0 &&
        <div className={classes.surveyList}>
          {surveys?.map((s) =>
            <Link
              key={s._id}
              to={`/survey/${s._id}/edit`}
              className={classes.link}
            >
              {s.name} (<FormatDate date={s.createdAt} includeAgo />)
            </Link>
          )}
        </div>
      }
      {!loadingSurveys && !!surveys && surveys.length < 1 &&
        <div className={classes.secondaryText}>No surveys found</div>
      }
      {loadingSurveys && <Loading />}
      <EAButton onClick={onOpenCreateSurveyModal}>
        New survey
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
