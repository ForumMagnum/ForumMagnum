import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { useCreate } from "@/lib/crud/withCreate";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { CLIENT_ID_COOKIE, HIDE_SURVEY_SCHEDULE_IDS } from "@/lib/cookies/cookies";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Collapse from "@material-ui/core/Collapse";
import range from "lodash/range";
import type { SurveyQuestionFormat } from "@/lib/collections/surveyQuestions/schema";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: SECTION_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: 14,
    height: 80,
    display: "flex",
    alignItems: "center",
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
  },
  questions: {
    flexGrow: 1,
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
    gap: "6px",
  },
  rankButton: {
    padding: 0,
    minHeight: 30,
  },
  tripleDot: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    fontSize: 20,
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
  const {EAButton} = Components;
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
  default:
      // TODO
      throw new Error("TODO: Implement other question formats");
  }
}

const SurveyPostsItemInternal = ({survey, surveyScheduleId, collapse, classes}: {
  survey: SurveyMinimumInfo,
  surveyScheduleId?: string,
  collapse: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setResponses] = useState<Record<string, QuestionResponse>>({});

  const [cookies, setCookie] = useCookiesWithConsent([
    HIDE_SURVEY_SCHEDULE_IDS,
    CLIENT_ID_COOKIE,
  ]);
  const clientId = cookies[CLIENT_ID_COOKIE];
  const hideSurveyScheduleIds = cookies[HIDE_SURVEY_SCHEDULE_IDS] || [];

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
      collapse();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error submitting survey:", e);
      setIsSubmitting(false);
    }
  }, [
    collapse,
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
    setCookie(
      HIDE_SURVEY_SCHEDULE_IDS,
      [...hideSurveyScheduleIds, surveyScheduleId],
    );
    captureEvent("surveyDismiss", {
      surveyId: survey._id,
      surveyScheduleId,
    });
  }, [captureEvent, survey._id, surveyScheduleId, hideSurveyScheduleIds, setCookie]);

  const onOptOut = useCallback(() => {
    // TODO: Opt-out
    captureEvent("surveyOptOut", {
      surveyId: survey._id,
      surveyScheduleId,
    });
  }, [captureEvent, survey._id, surveyScheduleId]);

  if (cookies[HIDE_SURVEY_SCHEDULE_IDS]?.includes(surveyScheduleId)) {
    return null;
  }

  const {
    LWTooltip, ForumIcon, LWClickAwayListener, DropdownMenu, DropdownItem,
    PopperCard, Loading,
  } = Components;
  return (
    <div className={classes.root}>
      <LWTooltip
        title="Some really informative stuff"
        placement="right"
        inlineBlock={false}
        className={classes.tooltip}
      >
        <ForumIcon icon="QuestionMarkCircle" className={classes.info} />
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
      {/* TODO; Misaligned */}
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
            <DropdownItem
              title="Dismiss"
              icon="Close"
              onClick={onDismiss}
            />
            <DropdownItem
              title="Opt-out of feedback"
              icon="No"
              onClick={onOptOut}
            />
          </DropdownMenu>
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
}

const SurveyPostsItem = ({survey, surveyScheduleId, classes}: {
  survey: SurveyMinimumInfo,
  surveyScheduleId?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapse = useCallback(() => setIsCollapsed(true), []);
  return (
    <Collapse in={!isCollapsed}>
      <AnalyticsContext pageElementContext="surveyPostsItem">
        <SurveyPostsItemInternal
          survey={survey}
          surveyScheduleId={surveyScheduleId}
          collapse={collapse}
          classes={classes}
        />
      </AnalyticsContext>
    </Collapse>
  );
}

const SurveyPostsItemComponent = registerComponent(
  "SurveyPostsItem",
  SurveyPostsItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    SurveyPostsItem: typeof SurveyPostsItemComponent
  }
}
