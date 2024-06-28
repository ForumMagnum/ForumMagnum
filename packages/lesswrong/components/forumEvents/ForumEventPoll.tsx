import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";
import { useEventListener } from "../hooks/useEventListener";
import { gql, useMutation } from "@apollo/client";
import { useDialog } from "../common/withDialog";
import { useMulti } from "@/lib/crud/withMulti";
import ForumNoSSR from "../common/ForumNoSSR";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";

export const POLL_MAX_WIDTH = 730;
const SLIDER_MAX_WIDTH = 1000;
const USER_IMAGE_SIZE = 24;

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: 'center',
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: '10px 30px 30px',
    margin: '0 auto',
    [`@media (max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: 'none',
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
  sliderLineCol: {
    flexGrow: 1,
    maxWidth: SLIDER_MAX_WIDTH,
  },
  sliderLine: {
    position: 'relative',
    width: '100%',
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
  userVote: {
    position: 'absolute',
    top: -USER_IMAGE_SIZE/2,
    zIndex: 1,
  },
  currentUserVote: {
    opacity: 0.6,
    cursor: 'grab',
    zIndex: 2,
    touchAction: 'none',
    '&:hover': {
      opacity: 1,
    }
  },
  currentUserVotePlaceholder: {
    top: -(USER_IMAGE_SIZE/2) - 5,
  },
  currentUserVoteDragging: {
    cursor: 'grabbing',
  },
  currentUserVoteActive: {
    opacity: 1,
    '&:hover .ForumEventPoll-clearVote': {
      display: 'flex',
    }
  },
  voteTooltipHeading: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: '140%',
    marginBottom: 4,
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '140%',
  },
  userImage: {
    outline: `2px solid ${theme.palette.text.alwaysWhite}`,
  },
  placeholderUserIcon: {
    // add a black background to the placeholder user circle icon
    background: `radial-gradient(${theme.palette.text.alwaysBlack} 50%, transparent 50%)`,
    color: theme.palette.text.alwaysWhite,
    fontSize: 34,
    borderRadius: '50%',
  },
  clearVote: {
    display: 'none',
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 65%, ${theme.palette.text.alwaysWhite} 35%)`,
    padding: 2,
    borderRadius: '50%',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.text.alwaysBlack,
    }
  },
  clearVoteIcon: {
    fontSize: 10,
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    marginTop: 22,
  },
  viewResultsButton: {
    background: 'none',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    color: theme.palette.text.alwaysWhite,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    padding: 0,
    '&:hover': {
      opacity: 0.7
    }
  },
});

export type ForumEventVoteData = {
  forumEventId: string,
  x: number,
  delta?: number,
  postIds?: string[]
}

export const addForumEventVoteQuery = gql`
  mutation AddForumEventVote($forumEventId: String!, $x: Float!, $delta: Float, $postIds: [String]) {
    AddForumEventVote(forumEventId: $forumEventId, x: $x, delta: $delta, postIds: $postIds)
  }
`;
const removeForumEventVoteQuery = gql`
  mutation RemoveForumEventVote($forumEventId: String!) {
    RemoveForumEventVote(forumEventId: $forumEventId)
  }
`;

const maxVotePos = (SLIDER_MAX_WIDTH - USER_IMAGE_SIZE) / SLIDER_MAX_WIDTH
// The default vote position is in the middle of the slider
const defaultVotePos = maxVotePos / 2

const PollQuestion = ({event, classes}: {
  event: ForumEventsDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const {LWTooltip} = Components;

  // The poll question should prob be added to the ForumEvents schema,
  // but in the interest of time, for this event I will just hardcode it here
  return <div className={classes.question}>
    “AI welfare
    <LWTooltip
      title="
        By “AI welfare”, we mean the potential wellbeing (pain,
        pleasure, but also frustration, satisfaction etc...) of
        future artificial intelligence systems.
      "
    >
      <span className={classes.questionFootnote} style={{color: event.contrastColor ?? event.darkColor}}>
        1
      </span>
    </LWTooltip>{" "}
    should be an EA priority
    <LWTooltip
      title="
        By “EA priority” we mean that 5% of (unrestricted, i.e.
        open to EA-style cause prioritisation) talent and 5% of
        (unrestricted, i.e. open to EA-style cause prioritisation)
        funding should be allocated to this cause.
      "
    >
      <span className={classes.questionFootnote} style={{color: event.contrastColor ?? event.darkColor}}>
        2
      </span>
    </LWTooltip>”
  </div>
}

/**
 * This component is for forum events that have a poll.
 * Displays the question, a slider where the user can vote on a scale from "Disagree" to "Agree",
 * and lets the user view the poll results (votes are public).
 *
 * When a user updates their vote, we award points to posts that changed the user's mind.
 * If a postId is provided, we just give points to that post (ex. when on a post page).
 * Otherwise, we open a modal.
 */
export const ForumEventPoll = ({postId, hideViewResults, classes}: {
  postId?: string,
  hideViewResults?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent: event, refetch} = useCurrentForumEvent()
  const {onSignup} = useLoginPopoverContext()
  const {openDialog} = useDialog()
  const currentUser = useCurrentUser()
  // Pull the current user's vote position to initialize the component
  // (note that 0 is a valid vote)
  const initialUserVotePos: number|null = currentUser ? (event?.publicData?.[currentUser._id]?.x ?? null) : null
  // The actual x position of the left side of the user's vote circle,
  // as a number between 0 and 0.976 (i.e. (SLIDER_MAX_WIDTH - USER_IMAGE_SIZE) / SLIDER_MAX_WIDTH)
  const [votePos, setVotePos] = useState<number>(initialUserVotePos ?? defaultVotePos)
  // The x position of the vote in the db
  const [currentUserVote, setCurrentUserVote] = useState<number|null>(initialUserVotePos)
  const hasVoted = currentUserVote !== null
  
  const sliderRef = useRef<HTMLDivElement|null>(null)
  // Whether or not the user is currently dragging their vote
  const [isDragging, setIsDragging] = useState(false)

  // Whether or not the poll results (i.e. other users' votes) are visible.
  // They are hidden until the user clicks on "view results".
  const [resultsVisible, setResultsVisible] = useState(false)
  const [voteCount, setVoteCount] = useState(event?.voteCount ?? 0)
  
  // Get profile image and display name for all other users who voted, to display on the slider
  const { results: voters } = useMulti({
    terms: {
      view: 'usersByUserIds',
      userIds: event?.publicData ?
        Object.keys(event?.publicData).filter(userId => userId !== currentUser?._id) :
        []
    },
    collectionName: "Users",
    fragmentName: 'UserOnboardingAuthor',
    enableTotal: false,
    skip: !event?.publicData,
  })
  
  const [addVote] = useMutation(
    addForumEventVoteQuery,
    {errorPolicy: "all"},
  )
  const [removeVote] = useMutation(
    removeForumEventVoteQuery,
    {errorPolicy: "all"},
  )
  
  /**
   * When the user clicks the "x" icon, or when a logged out user tries to vote,
   * delete their vote data
   */
  const clearVote = useCallback(async (e?: React.PointerEvent) => {
    e?.stopPropagation()
    setVotePos(defaultVotePos)
    setCurrentUserVote(null)
    if (currentUser && event) {
      setVoteCount(count => count - 1)
      await removeVote({variables: {forumEventId: event._id}})
      refetch?.()
    }
  }, [setVotePos, setCurrentUserVote, currentUser, removeVote, event, refetch])
  
  /**
   * When the user pointerdowns on their vote circle, start dragging it
   */
  const startDragVote = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [setIsDragging])
  
  /**
   * When the user drags their vote, update its x position
   */
  const updateVotePos = useCallback((e: PointerEvent) => {
    if (!isDragging || !sliderRef.current) return
    
    // If the user's pointer is off to the left or right of the slider,
    // set the vote to the corresponding end of the slider
    const sliderRect = sliderRef.current.getBoundingClientRect()
    const sliderWidth = sliderRect.right - sliderRect.left
    console.log('e.clientX', e.clientX)
    console.log('sliderRect.left', sliderRect.left)
    if (e.clientX < sliderRect.left) {
      setVotePos(0)
      return
    } else if (e.clientX > sliderRect.right) {
      setVotePos(maxVotePos)
      return
    }
    
    const newVotePos = (e.clientX - sliderRect.left - (USER_IMAGE_SIZE/2)) / sliderWidth
    setVotePos(Math.min(Math.max(newVotePos, 0), maxVotePos))
  }, [isDragging, setVotePos])
  useEventListener("pointermove", updateVotePos)

  /**
   * When the user is done dragging their vote:
   * - If the user is logged out, reset their vote and open the login modal
   * - If this is the user's initial vote, save the vote
   * - If we have a postId (because we're on the post page), save the vote
   * - Otherwise (we're on the home page), open the post selection modal
   */
  const saveVotePos = useCallback(async () => {
    console.log('pointerup')
    if (!isDragging || !event) return

    setIsDragging(false)
    // When a logged-in user is done dragging their vote, attempt to save it
    if (currentUser) {
      const voteData: ForumEventVoteData = {
        forumEventId: event._id,
        x: votePos,
      }
      if (!hasVoted) {
        setVoteCount(count => count + 1)
        setCurrentUserVote(votePos)
        await addVote({variables: voteData})
        refetch?.()
        return
      }
      const delta = votePos - (currentUserVote ?? defaultVotePos)
      if (delta) {
        voteData.delta = delta
        setCurrentUserVote(votePos)
        if (postId) {
          await addVote({variables: {
            ...voteData,
            postIds: [postId]
          }})
          refetch?.()
        } else if (event.tag) {
          openDialog({
            componentName: "ForumEventPostSelectionDialog",
            componentProps: {tag: event.tag, voteData}
          })
        }
      }
    }
    // When a logged-out user tries to vote, just show the login modal
    else {
      onSignup()
      void clearVote()
    }
  }, [
    isDragging,
    setIsDragging,
    hasVoted,
    currentUser,
    addVote,
    event,
    votePos,
    currentUserVote,
    postId,
    setCurrentUserVote,
    openDialog,
    onSignup,
    clearVote,
    refetch
  ])
  useEventListener("pointerup", saveVotePos)

  const {ForumIcon, LWTooltip, UsersProfileImage} = Components;
  
  if (!event) return null

  return (
    <AnalyticsContext pageElementContext="forumEventPoll">
      <div className={classes.root}>
        <PollQuestion event={event} classes={classes} />

        <div className={classes.sliderRow}>
          <ForumIcon icon="ChevronLeft" className={classNames(classes.sliderArrow, classes.sliderArrowLeft)} />
          <div className={classes.sliderLineCol}>
            <div className={classes.sliderLine} ref={sliderRef}>
              {resultsVisible && voters && voters.map(user => {
                const vote = event.publicData[user._id]
                return <div key={user._id} className={classes.userVote} style={{left: `${vote.x}px`}}>
                  <LWTooltip title={<div className={classes.voteTooltipBody}>{user.displayName}</div>}>
                    <UsersProfileImage user={user} size={USER_IMAGE_SIZE} className={classes.userImage} />
                  </LWTooltip>
                </div>
              })}
              <div
                className={classNames(
                  classes.userVote,
                  classes.currentUserVote,
                  !currentUser && classes.currentUserVotePlaceholder,
                  isDragging && classes.currentUserVoteDragging,
                  hasVoted && classes.currentUserVoteActive
                )}
                onPointerDown={startDragVote}
                style={{left: `${votePos * 100}%`}}
              >
                <LWTooltip title={hasVoted ? <div className={classes.voteTooltipBody}>Drag to move</div> : <>
                    <div className={classes.voteTooltipHeading}>Click and drag to vote</div>
                    <div className={classes.voteTooltipBody}>Votes are non-anonymous and can be changed at any time</div>
                  </>}
                >
                  {currentUser ?
                    <UsersProfileImage user={currentUser} size={USER_IMAGE_SIZE} className={classes.userImage} /> :
                    <ForumIcon icon="UserCircle" className={classes.placeholderUserIcon} />
                  }
                  <div className={classes.clearVote} onPointerDown={clearVote}>
                    <ForumIcon icon="Close" className={classes.clearVoteIcon} />
                  </div>
                </LWTooltip>
              </div>
            </div>
            <div className={classes.sliderLabels}>
              <div>Disagree</div>
              <ForumNoSSR>
                {!hideViewResults && !resultsVisible && <div>
                  {(voteCount > 0) && `${voteCount} vote${voteCount === 1 ? '' : 's'} so far. `}
                  {hasVoted ? 'Click and drag to update your vote, or ' : 'Place your vote or '}
                  <button className={classes.viewResultsButton} onClick={() => setResultsVisible(true)}>
                    view results
                  </button>
                </div>}
              </ForumNoSSR>
              <div>Agree</div>
            </div>
          </div>
          <ForumIcon icon="ChevronRight" className={classNames(classes.sliderArrow, classes.sliderArrowRight)} />
        </div>

      </div>
    </AnalyticsContext>
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
