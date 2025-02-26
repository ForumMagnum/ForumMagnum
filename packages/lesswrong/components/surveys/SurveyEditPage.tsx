import React, { useCallback, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Link } from "@/lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";
import { useLocation } from "@/lib/routeUtil";
import { useSingle } from "@/lib/crud/withSingle";
import { SurveyQuestionFormat, surveyQuestionFormats } from "@/lib/collections/surveyQuestions/schema";
import type { SettingsOption } from "@/lib/collections/posts/dropdownOptions";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingTop: 30,
  },
  surveyAdmin: {
    color: theme.palette.primary.main,
  },
  secondaryText: {
    color: theme.palette.grey[600],
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  surveyName: {
    margin: "20px 0",
  },
  surveyId: {
    textTransform: "none",
  },
  question: {
    marginTop: 4,
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: 14,
    display: "flex",
    gap: "14px",
    "& > :first-child": {
      flexGrow: 1,
    },
  },
  questionInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
  },
  questionFormat: {
    display: "flex",
    "& .SectionTitle-root": {
      padding: 0,
    },
    [theme.breakpoints.down("sm")]: {
      "& .SectionTitle-root": {
        marginRight: -20,
      },
    },
  },
  questionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  error: {
    color: theme.palette.text.error2,
  },
  buttons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  submit: {
    width: 100,
  },
});

const formatOptions: Record<string, SettingsOption> = Object.fromEntries(
  Object
    .keys(surveyQuestionFormats)
    .map((format: SurveyQuestionFormat) =>
      [format, {label: surveyQuestionFormats[format]}],
    ),
);

export type SurveyQuestionInfo = {
  _id?: string,
  question: string,
  format: SurveyQuestionFormat,
}

const SurveyForm = ({survey, refetch, classes}: {
  survey: SurveyMinimumInfo,
  refetch?: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}) => {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(survey.name);
  const [questions, setQuestions] = useState<SurveyQuestionInfo[]>(
    survey.questions.map(({_id, question, format}) => ({_id, question, format})),
  );

  const onMoveUp = useCallback((index: number) => {
    setQuestions((questions) => [
      ...questions.slice(0, index - 1),
      questions[index],
      questions[index - 1],
      ...questions.slice(index + 1),
    ]);
  }, []);

  const onMoveDown = useCallback((index: number) => {
    setQuestions((questions) => [
      ...questions.slice(0, index),
      questions[index + 1],
      questions[index],
      ...questions.slice(index + 2),
    ]);
  }, []);

  const setQuestion = useCallback((index: number, question: string) => {
    setQuestions((questions) => [
      ...questions.slice(0, index),
      {...questions[index], question},
      ...questions.slice(index + 1),
    ]);
  }, []);

  const setFormat = useCallback((index: number, format: SurveyQuestionFormat) => {
    setQuestions((questions) => [
      ...questions.slice(0, index),
      {...questions[index], format},
      ...questions.slice(index + 1),
    ]);
  }, []);

  const onDeleteQuestion = useCallback((index: number) => {
    setQuestions((questions) =>
      questions.slice(0, index).concat(questions.slice(index + 1)),
    );
  }, []);

  const onAddQuestion = useCallback(() => {
    setQuestions((questions) => [...questions, {
      question: "New question?",
      format: "rank0To10",
    }]);
  }, []);

  const [updateSurvey] = useMutation(gql`
    mutation editSurvey($surveyId: String!, $name: String!, $questions: [SurveyQuestionInfo!]!) {
      editSurvey(surveyId: $surveyId, name: $name, questions: $questions) {
        ...SurveyMinimumInfo
      }
    }
    ${getFragment("SurveyMinimumInfo")}
  `);

  const onSubmit = useCallback(async () => {
    setError("");
    setSaving(true);
    try {
      await updateSurvey({
        variables: {
          surveyId: survey._id,
          name,
          questions,
        },
      });
      await refetch?.();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }, [updateSurvey, refetch, survey._id, name, questions]);

  const {
    EAOnboardingInput, EAButton, ForumIcon, LWTooltip, ForumDropdown,
    SectionTitle, Loading,
  } = Components;
  return (
    <div className={classes.form}>
      <EAOnboardingInput
        value={name}
        setValue={setName}
        placeholder="Survey name"
        disabled={saving}
        className={classes.surveyName}
      />
      {questions.map(({question, format}, i) => (
        <div key={i} className={classes.question}>
          <div className={classes.questionInfo}>
            <EAOnboardingInput
              value={question}
              setValue={setQuestion.bind(null, i)}
              placeholder="Question"
              disabled={saving}
            />
            <div className={classes.questionFormat}>
              <SectionTitle title="Response type:" noTopMargin />
              <ForumDropdown
                value={format}
                options={formatOptions}
                onSelect={setFormat.bind(null, i)}
                disabled={saving}
              />
            </div>
          </div>
          <div className={classes.questionButtons}>
            <LWTooltip title="Move up" placement="bottom">
              <EAButton
                variant="outlined"
                onClick={onMoveUp.bind(null, i)}
                disabled={i === 0 || saving}
              >
                <ForumIcon icon="NarrowArrowUp" />
              </EAButton>
            </LWTooltip>
            <LWTooltip title="Move down" placement="bottom">
              <EAButton
                variant="outlined"
                onClick={onMoveDown.bind(null, i)}
                disabled={i === questions.length - 1 || saving}
              >
                <ForumIcon icon="NarrowArrowDown" />
              </EAButton>
            </LWTooltip>
            <LWTooltip title="Delete" placement="bottom">
              <EAButton
                variant="outlined"
                onClick={onDeleteQuestion.bind(null, i)}
                disabled={saving}
              >
                <ForumIcon icon="Close" />
              </EAButton>
            </LWTooltip>
          </div>
        </div>
      ))}
      {error &&
        <div className={classes.error}>Error: {error}</div>
      }
      <div className={classes.buttons}>
        <EAButton onClick={onAddQuestion} variant="outlined" disabled={saving}>
          <ForumIcon icon="Plus" /> Add question
        </EAButton>
        <EAButton onClick={onSubmit} disabled={saving} className={classes.submit}>
          {saving ? <Loading /> : "Save"}
        </EAButton>
      </div>
    </div>
  );
}

const SurveyEditor = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {params: {id}} = useLocation();
  const {document: survey, loading, refetch} = useSingle({
    collectionName: "Surveys",
    fragmentName: "SurveyMinimumInfo",
    documentId: id,
  });

  const {SingleColumnSection, SectionTitle, Loading} = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <Link to="/admin/surveys" className={classes.surveyAdmin}>
        &lt;- Back to survey admin
      </Link>
      <SectionTitle title={
        <>
          Edit survey (id <span className={classes.surveyId}>{id}</span>)
        </>
      } />
      {loading && <Loading />}
      {!loading && !survey &&
        <div className={classes.secondaryText}>Survey not found</div>
      }
      {survey &&
        <SurveyForm survey={survey} refetch={refetch} classes={classes} />
      }
    </SingleColumnSection>
  );
}

const SurveyEditPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  return currentUser?.isAdmin
    ? <SurveyEditor classes={classes} />
    : <Components.Error404 />;
}

const SurveyEditPageComponent = registerComponent(
  "SurveyEditPage",
  SurveyEditPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    SurveyEditPage: typeof SurveyEditPageComponent
  }
}
