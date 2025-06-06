import React, { FormEvent, useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { Link } from "@/lib/reactRouterWrapper";
import Error404 from "../common/Error404";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import EAButton from "../ea-forum/EAButton";
import FormatDate from "../common/FormatDate";
import BlurredBackgroundModal from "../common/BlurredBackgroundModal";
import EAOnboardingInput from "../ea-forum/onboarding/EAOnboardingInput";
import LoadMore from "../common/LoadMore";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const SurveyScheduleEditMultiQuery = gql(`
  query multiSurveyScheduleSurveyAdminPageQuery($selector: SurveyScheduleSelector, $limit: Int, $enableTotal: Boolean) {
    surveySchedules(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SurveyScheduleEdit
      }
      totalCount
    }
  }
`);

const SurveyMinimumInfoMultiQuery = gql(`
  query multiSurveySurveyAdminPageQuery($selector: SurveySelector, $limit: Int, $enableTotal: Boolean) {
    surveys(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SurveyMinimumInfo
      }
      totalCount
    }
  }
`);

const SurveyMinimumInfoMutation = gql(`
  mutation createSurveySurveyAdminPage($data: CreateSurveyDataInput!) {
    createSurvey(data: $data) {
      data {
        ...SurveyMinimumInfo
      }
    }
  }
`);

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

  const { data, loading: loadingSurveys, refetch: refetchSurveys, loadMoreProps: loadMoreSurveysProps } = useQueryWithLoadMore(SurveyMinimumInfoMultiQuery, {
    variables: {
      selector: { surveysByCreatedAt: {} },
      limit: 10,
      enableTotal: false,
    },
  });

  const surveys = data?.surveys?.results;

  const [createSurvey, { loading: loadingCreateSurvey, error: createSurveyError }] = useMutation(SurveyMinimumInfoMutation);

  const { data: dataSurveyScheduleEdit, loading: loadingSurveySchedules, loadMoreProps: loadMoreSurveySchedulesProps } = useQueryWithLoadMore(SurveyScheduleEditMultiQuery, {
    variables: {
      selector: { surveySchedulesByCreatedAt: {} },
      limit: 10,
      enableTotal: false,
    },
  });

  const surveySchedules = dataSurveyScheduleEdit?.surveySchedules?.results;

  const onOpenCreateSurveyModal = useCallback(() => {
    setShowCreateSurveyModal(true);
  }, []);

  const onCloseCreateSurveyModal = useCallback(() => {
    setShowCreateSurveyModal(false);
  }, []);

  const onCreateSurvey = useCallback(async () => {
    await createSurvey({
      variables: {
        data: {
          name: newSurveyName,
        }
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
                {name} ({survey?.name}) (<FormatDate date={createdAt} includeAgo />)
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
    : <Error404 />;
}

export default registerComponent(
  "SurveyAdminPage",
  SurveyAdminPage,
  {styles},
);


