import React, { useCallback, useEffect, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { captureException } from "@sentry/core";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from "../common/withUser";
import { useCreate } from "@/lib/crud/withCreate";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { CLIENT_ID_COOKIE, HIDE_SURVEY_SCHEDULE_IDS } from "@/lib/cookies/cookies";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import Collapse from "@/lib/vendor/@material-ui/core/src/Collapse";
import range from "lodash/range";
import {
  SurveyQuestionFormat,
  surveyQuestionFormats
} from "@/lib/collections/surveyQuestions/constants";
import EAButton from "../ea-forum/EAButton";
import EAOnboardingInput from "../ea-forum/onboarding/EAOnboardingInput";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import LWClickAwayListener from "../common/LWClickAwayListener";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import PopperCard from "../common/PopperCard";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: SECTION_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: 14,
    minHeight: 80,
    display: "flex",
    alignItems: "flex-start",
  },
  loading: {
    height: "unset",
  },
  tooltip: {
    display: "flex",
  },
  info: {
    marginRight: 13,
    color: theme.palette.grey[600],
    fontSize: "1.4em",
  },
  questions: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  question: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  questionText: {
    fontWeight: 600,
    fontSize: 16,
    color: theme.palette.greyAlpha(0.87),
  },
  rankButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  rankButton: {
    padding: 0,
    minHeight: 30,
  },
  dismiss: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    fontSize: 20,
    marginRight: 6,
    "&:hover": {
      color: theme.palette.grey[1000],
    },
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  tripleDot: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    fontSize: 20,
    marginRight: -2,
    "&:hover": {
      color: theme.palette.grey[700],
    },
  },
  menu: {
    maxWidth: "calc(100vw - 100px)",
  },
});

type QuestionResponse = string | number;

const QuestionReponse = ({format, onRespond, classes}: {
  format: SurveyQuestionFormat,
  onRespond: (response: QuestionResponse) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!surveyQuestionFormats[format]) {
      captureException(new Error(`Invalid survey question format: ${format}`));
    }
  }, [format]);

  switch (format) {
  case "rank0To10":
    return (
      <div className={classes.rankButtons}>
        {range(0, 11).map((i) => (
          <EAButton
            key={i}
            onClick={onRespond.bind(null, i)}
            variant="outlined"
            className={classes.rankButton}
          >
            {i}
          </EAButton>
        ))}
      </div>
    );
  case "text": case "multilineText":
    return (
      <form onSubmit={onRespond.bind(null, value)}>
        <EAOnboardingInput
          value={value}
          setValue={setValue}
          placeholder="Answer here..."
          As={format === "multilineText" ? "textarea" : "input"}
          rows={format === "multilineText" ? 3 : 1}
        />
      </form>
    );
  default:
    return (
      <div>Invalid format</div>
    );
  }
}

const SurveyPostsItemInternal = ({
  survey,
  surveyScheduleId,
  refetchSurvey,
  collapse,
  classes,
}: {
  survey: SurveyMinimumInfo,
  surveyScheduleId?: string,
  refetchSurvey?: () => Promise<void>,
  collapse: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setResponses] = useState<Record<string, QuestionResponse>>({});

  const [cookies, setCookie] = useCookiesWithConsent([
    HIDE_SURVEY_SCHEDULE_IDS,
    CLIENT_ID_COOKIE,
  ]);
  const clientId = cookies[CLIENT_ID_COOKIE];
  const hideSurveyScheduleIds = cookies[HIDE_SURVEY_SCHEDULE_IDS];

  const onToggleMenu = useCallback(() => {
    setIsOpen((open) => {
      const newOpen = !open;
      captureEvent("tripleDotClick", {
        open: newOpen,
        itemType: "survey",
        surveyId: survey._id,
      });
      return newOpen;
    });
  }, [captureEvent, survey._id]);

  const {create: createResponse} = useCreate({
    collectionName: "SurveyResponses",
    fragmentName: "SurveyResponseMinimumInfo",
  });

  const onSubmit = useCallback(async (response: Record<string, QuestionResponse>) => {
    setIsSubmitting(true);
    try {
      await createResponse({
        data: {
          surveyId: survey._id,
          surveyScheduleId,
          userId: currentUser?._id,
          clientId,
          response,
        },
      });
      captureEvent("surveySubmit", {
        surveyId: survey._id,
        surveyScheduleId,
        response,
      });
      void refetchSurvey?.();
      collapse();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error submitting survey:", e);
      setIsSubmitting(false);
    }
  }, [
    collapse,
    refetchSurvey,
    captureEvent,
    survey._id,
    surveyScheduleId,
    createResponse,
    currentUser?._id,
    clientId,
  ]);

  const onRespond = useCallback(async (
    questionId: string,
    response: QuestionResponse,
  ) => {
    setResponses((responses) => {
      const newResponses = {
        ...responses,
        [questionId]: response,
      };
      if (Object.keys(newResponses).length === survey.questions.length) {
        void onSubmit(newResponses);
      }
      return newResponses;
    });
    setResponses((responses) => ({
      ...responses,
      [questionId]: response,
    }));
    captureEvent("surveyResponse", {
      surveyId: survey._id,
      surveyScheduleId,
      questionId,
      response,
    });
  }, [captureEvent, survey, surveyScheduleId, onSubmit]);

  const onDismiss = useCallback(() => {
    collapse();
    setTimeout(() => {
      setCookie(
        HIDE_SURVEY_SCHEDULE_IDS,
        [...(hideSurveyScheduleIds || []), surveyScheduleId],
      );
    }, 500);
    captureEvent("surveyDismiss", {
      surveyId: survey._id,
      surveyScheduleId,
    });
  }, [
    collapse,
    captureEvent,
    survey._id,
    surveyScheduleId,
    hideSurveyScheduleIds,
    setCookie,
  ]);

  const onOptOut = useCallback(() => {
    void updateCurrentUser({optedOutOfSurveys: true});
    collapse();
    void refetchSurvey?.();
    captureEvent("surveyOptOut", {
      surveyId: survey._id,
      surveyScheduleId,
    });
  }, [
    captureEvent,
    survey._id,
    surveyScheduleId,
    refetchSurvey,
    collapse,
    updateCurrentUser,
  ]);

  if (hideSurveyScheduleIds?.includes(surveyScheduleId)) {
    return null;
  }
  return (
    <div className={classes.root}>
      <LWTooltip
        title="This is a user survey"
        placement="right"
        inlineBlock={false}
        className={classes.tooltip}
      >
        <ForumIcon icon="QuestionMarkCircleFilled" className={classes.info} />
      </LWTooltip>
      <div className={classes.questions}>
        {isSubmitting
          ? <Loading className={classes.loading} />
          : survey.questions.map(({_id, question, format}) => (
            <div key={_id} className={classes.question}>
              <div className={classes.questionText}>{question}</div>
              <QuestionReponse
                format={format}
                onRespond={onRespond.bind(null, _id)}
                classes={classes}
              />
            </div>
          ))
        }
      </div>
      <LWTooltip title="Dismiss">
        <ForumIcon icon="Close" onClick={onDismiss} className={classes.dismiss} />
      </LWTooltip>
      <div ref={anchorEl}>
        <MoreVertIcon
          onClick={onToggleMenu}
          className={classes.tripleDot}
        />
      </div>
      <PopperCard
        open={isOpen}
        placement="left-start"
        anchorEl={anchorEl.current}
        allowOverflow
      >
        <LWClickAwayListener onClickAway={setIsOpen.bind(null, false)}>
          <DropdownMenu className={classes.menu}>
            {currentUser?.isAdmin &&
              <DropdownItem
                title="Edit survey"
                icon="Edit"
                to={`/survey/${survey._id}/edit`}
              />
            }
            {currentUser?.isAdmin && surveyScheduleId &&
              <DropdownItem
                title="Edit survey schedule"
                icon="Clock"
                to={`/surveySchedule/${surveyScheduleId}`}
              />
            }
            <DropdownItem
              title="Dismiss"
              icon="Close"
              onClick={onDismiss}
            />
            {currentUser && <DropdownItem
              title="Opt-out of surveys"
              icon="No"
              onClick={onOptOut}
            />}
          </DropdownMenu>
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
}

const SurveyPostsItem = ({survey, surveyScheduleId, refetchSurvey, classes}: {
  survey: SurveyMinimumInfo,
  surveyScheduleId?: string,
  refetchSurvey?: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}) => {
  const transitionDuration = 1000;
  const [isRendered, setIsRendered] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    setTimeout(() => setIsRendered(false), transitionDuration);
  }, []);

  if (!isRendered) {
    return null;
  }
  return (
    <Collapse in={!isCollapsed} timeout={transitionDuration}>
      <AnalyticsContext pageElementContext="surveyPostsItem">
        <SurveyPostsItemInternal
          survey={survey}
          surveyScheduleId={surveyScheduleId}
          refetchSurvey={refetchSurvey}
          collapse={collapse}
          classes={classes}
        />
      </AnalyticsContext>
    </Collapse>
  );
}

export default registerComponent(
  "SurveyPostsItem",
  SurveyPostsItem,
  {styles},
);


