import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import MoreVertIcon from '@material-ui/icons/MoreVert';
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

const QuestionReponse = ({format, onRespond, classes}: {
  format: SurveyQuestionFormat,
  onRespond: (response: string | number) => void,
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

const SurveyPostsItemInternal = ({survey, classes}: {
  survey: SurveyMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const onRespond = useCallback((response: string | number) => {
    // TODO: Send response to the server
    captureEvent("surveyResponse", {
      surveyId: survey._id,
      response,
      source: "SurveyPostsItem",
    });
  }, [captureEvent, survey._id]);

  const onDismiss = useCallback(() => {
    // TODO: Dismiss
    captureEvent("surveyDismiss", {
      surveyId: survey._id,
      source: "SurveyPostsItem",
    });
  }, [captureEvent, survey._id]);

  const onOptOut = useCallback(() => {
    // TODO: Opt-out
    captureEvent("surveyOptOut", {
      surveyId: survey._id,
      source: "SurveyPostsItem",
    });
  }, [captureEvent, survey._id]);

  const {
    LWTooltip, ForumIcon, LWClickAwayListener, DropdownMenu, DropdownItem,
    PopperCard,
  } = Components;
  return (
    <div className={classes.root}>
      <LWTooltip title="Some really informative stuff" placement="right">
        <ForumIcon icon="QuestionMarkCircle" className={classes.info} />
      </LWTooltip>
      <div className={classes.questions}>
        {survey.questions.map(({_id, question, format}) => (
          <div key={_id} className={classes.question}>
            <div className={classes.questionText}>{question}</div>
            <QuestionReponse
              format={format}
              onRespond={onRespond}
              classes={classes}
            />
          </div>
        ))}
      </div>
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

const SurveyPostsItem = ({survey, classes}: {
  survey: SurveyMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageElementContext="surveyPostsItem">
      <SurveyPostsItemInternal survey={survey} classes={classes} />
    </AnalyticsContext>
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
