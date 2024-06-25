import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";
import { useEventListener } from "../hooks/useEventListener";
import { gql, useMutation } from "@apollo/client";

const SLIDER_WIDTH = 1000;
const USER_IMAGE_SIZE = 24;

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: 'center',
    padding: '10px 30px 30px',
    margin: '0 auto',
    ['@media(max-width: 1040px)']: {
      display: 'none'
    },
  },
  question: {
    fontSize: 32,
    lineHeight: '110%',
    fontWeight: 700,
  },
  questionFootnote: {
    fontSize: 20,
    verticalAlign: 'super',
  },
  sliderRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 36,
  },
  sliderLine: {
    position: 'relative',
    width: SLIDER_WIDTH,
    height: 2,
    backgroundColor: theme.palette.text.alwaysWhite,
  },
  sliderArrow: {
    transform: 'translateY(-11px)',
    stroke: theme.palette.text.alwaysWhite,
  },
  sliderArrowLeft: {
    marginRight: -15,
  },
  sliderArrowRight: {
    marginLeft: -15,
  },
  currentUserVote: {
    position: 'absolute',
    top: -USER_IMAGE_SIZE/2,
    opacity: 0.6,
    cursor: 'grab',
    '&:hover': {
      opacity: 1,
    }
  },
  currentUserVoteActive: {
    opacity: 1,
  },
  voteTooltipHeading: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: '140%',
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '140%',
    marginTop: 4,
  },
  currentUserImage: {
    border: `2px solid ${theme.palette.text.alwaysWhite}`,
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 22,
  },
  viewResultsButton: {
    background: 'none',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    color: theme.palette.text.alwaysWhite,
    textDecoration: 'underline',
    padding: 0,
    '&:hover': {
      opacity: 0.7
    }
  },
});

const addVoteQuery = gql`
  mutation AddForumEventVote($forumEventId: String!, $left: Int!) {
    AddForumEventVote(forumEventId: $forumEventId, left: $left)
  }
`;

const defaultVotePos = (SLIDER_WIDTH/2) - (USER_IMAGE_SIZE/2)

export const ForumEventPoll = ({event, classes}: {
  event: ForumEventsDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [isDragging, setIsDragging] = useState(false)
  const [votePos, setVotePos] = useState<number>(defaultVotePos)
  const [currentUserVote, setCurrentUserVote] = useState<number|null>(null)
  
  const [addVote] = useMutation(
    addVoteQuery,
    {errorPolicy: "all"},
  );
  
  const updateVotePos = useCallback((e: MouseEvent) => {
    if (isDragging) {
      console.log('e.movementX', e.movementX)
      // TODO: pause when mouse is too far right or left, and prob use percent
      setVotePos((val) => Math.min(Math.max(val + e.movementX, 0), SLIDER_WIDTH - (USER_IMAGE_SIZE/2)))
      setCurrentUserVote((val) => Math.min(Math.max((val ?? defaultVotePos) + e.movementX, 0), SLIDER_WIDTH - (USER_IMAGE_SIZE/2)))
    }
  }, [isDragging, setVotePos])
  useEventListener("mousemove", updateVotePos)
  useEventListener("mouseup", useCallback(() => setIsDragging(false), [setIsDragging]))
  
  useEffect(() => {
    // TODO: add modal
    if (currentUserVote && !isDragging) {
      void addVote({variables: {forumEventId: event._id, left: votePos}})
    }
  }, [isDragging, event._id, votePos, addVote])

  const {ForumIcon, LWTooltip, UsersProfileImage} = Components;

  // TODO: put this somewhere
  const pollQuestion = <div className={classes.question}>
    “AI welfare
    <LWTooltip
      title="By “AI welfare”, we mean the potential wellbeing (pain, pleasure, but also frustration, satisfaction etc...) of future artificial intelligence systems."
    >
      <span className={classes.questionFootnote} style={{color: event.contrastColor ?? event.darkColor}}>1</span>
    </LWTooltip>{" "}
    should be an EA priority
    <LWTooltip
      title="By “EA priority” we mean that 5% of (unrestricted, i.e. open to EA-style cause prioritisation) talent and 5% of (unrestricted, i.e. open to EA-style cause prioritisation) funding should be allocated to this cause."
    >
      <span className={classes.questionFootnote} style={{color: event.contrastColor ?? event.darkColor}}>2</span>
    </LWTooltip>”
  </div>

  return (
    <div className={classes.root}>
      {pollQuestion}
      <div className={classes.sliderRow}>
        <ForumIcon icon="ChevronLeft" className={classNames(classes.sliderArrow, classes.sliderArrowLeft)} />
        <div>
          <div className={classes.sliderLine}>
            <div className={classNames(classes.currentUserVote, isDragging && classes.currentUserVoteActive)} onMouseDown={() => setIsDragging(true)} style={{left: `${votePos}px`}}>
              <LWTooltip title={<>
                  <div className={classes.voteTooltipHeading}>Press and drag to vote</div>
                  <div className={classes.voteTooltipBody}>Votes are non-anonymous and can be changed at any time</div>
                </>}
              >
                <UsersProfileImage user={currentUser} size={USER_IMAGE_SIZE} className={classes.currentUserImage} />
              </LWTooltip>
            </div>
          </div>
          <div className={classes.sliderLabels}>
            <div>Disagree</div>
            {/* TODO: prob hide this when there are no votes? */}
            <div>{event.voteCount} votes so far. Place your vote or <button className={classes.viewResultsButton}>view results</button></div>
            <div>Agree</div>
          </div>
        </div>
        <ForumIcon icon="ChevronRight" className={classNames(classes.sliderArrow, classes.sliderArrowRight)} />
      </div>
    </div>
  );
}

const ForumEventPollComponent = registerComponent(
  "ForumEventPoll",
  ForumEventPoll,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventPoll: typeof ForumEventPollComponent
  }
}
