import React, {useState} from 'react';
import { registerComponent, Components, getFragmentText } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { DialogueUserRowProps, getRowProps, getUserCheckInfo } from '../users/DialogueMatchingPage';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';
import MuiPeopleIcon from "@material-ui/icons/People";
import { dialogueMatchmakingEnabled } from '../../lib/publicSettings';
import { useUpsertDialogueCheck } from '../hooks/useUpsertDialogueCheck';
import { DialogueUserResult } from './DialogueRecommendationRow';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  dialogueFacilitationItem: {
    paddingTop: 12,
    paddingBottom: 12,
    position: "relative",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    ...commentBodyStyles(theme),
    lineHeight: '1.65rem',
  },
  content: {
    paddingTop: 0,
    paddingRight: 35,
    paddingLeft: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 75,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    [theme.breakpoints.down('xs')]: {
      marginRight: 10,
      paddingRight: 20,
    },
    "& p": {
      marginBottom: 0,
      marginTop: 5,
    }
  },
  subsection: {
    marginBottom: theme.spacing.unit,
  },
  prompt: {
    color: theme.palette.lwTertiary.main,
    fontWeight: 645,
  },
  subheading: {
    marginTop: '10px',
  },

  dialogueUserRow: { 
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.panelBackground.default,
    padding: 8,
    marginBottom: 3,
    borderRadius: 2,
  },
  dialogueLeftContainer: {
    display: 'flex',
    maxWidth: '135px',
    minWidth: '135px',
    alignItems: 'center',
  },
  dialogueMatchCheckbox: {
    marginLeft: 6,
    width: 29,
    '& label': {
      marginRight: 0
    }
  },
  dialogueMatchUsername: {
    marginRight: 10,
    '&&': {
      color: theme.palette.text.primary,
      textAlign: 'left'
    },
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: 'auto',
    flexShrink: 'unset!important',
  },
  dialogueMatchNote: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  dialogueRightContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: 10,
    marginRight: 3,
    marginLeft: 'auto',
  },
  dialogueMatchMessageButton: {
    marginLeft: 'auto',
    marginRight: 10
  },
  dialogueMatchPreferencesButtonContainer: {
    marginLeft: 8,
    marginRight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    position: 'relative',
  },
  enterTopicsAnnotation: {
    fontStyle: 'italic',
    color: theme.palette.text.dim3,
    fontFamily: theme.palette.fonts.sansSerifStack,
    "fontSize": "0.9rem",
    "lineHeight": "1rem",
    marginTop: 4,
    whiteSpace: 'nowrap',
  },
  dialogueNoMatchesButton: {
    marginLeft: 8
  },
  topicRecommendationsList: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
    fontSize: 'small',
    overflow: 'hidden',
    justifyContent: 'space-between'
  },
  dialogueSectionSettings: {
    display: "flex",
    alignItems: "end",
  },
  settingsButton: {
    cursor: "pointer",
    marginLeft: "5px",
  },
  findDialoguePartners: {
    paddingRight: 5,
  },
  explanatoryNoteBox: {
    paddingLeft: "5px",
    marginBottom: "15px",
  },
  explanatoryNote: {
    color: theme.palette.text.dim3,
  },
  link: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.light,
    }
  },
  closeIcon: { 
    color: theme.palette.grey[500],
    opacity: 0.5,
    padding: 2,
  },
});

interface DialogueMatchRowProps {
  currentUser: UsersCurrent;
  rowProps: DialogueUserRowProps<boolean>; 
  classes: ClassesType<typeof styles>; 
  onHide: ({ dialogueCheckId, targetUserId }: { dialogueCheckId: string|undefined; targetUserId: string; }) => void;
}

const DialogueMatchRow = ({ currentUser, rowProps, classes, onHide }: DialogueMatchRowProps) => {
  const { DialogueCheckBox, UsersName, MessageButton, DialogueNextStepsButton, PostsItem2MetaInfo, ReactionIcon } = Components

  const { targetUser, checkId, userIsChecked, userIsMatched, matchPreference, reciprocalMatchPreference } = rowProps;

  return (
    <div key={targetUser._id} className={classes.dialogueUserRow}>
      <div className={classes.dialogueLeftContainer}>
        <div className={classes.dialogueMatchCheckbox}>
          <DialogueCheckBox
            targetUserId={targetUser._id}
            targetUserDisplayName={targetUser.displayName}
            checkId={checkId}
            isChecked={userIsChecked}
            isMatched={userIsMatched}
          />
        </div>
        <PostsItem2MetaInfo className={classes.dialogueMatchUsername}>
          <UsersName
            documentId={targetUser._id}
            simple={false}
          />
        </PostsItem2MetaInfo>
      </div>
      {!matchPreference && <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
        { reciprocalMatchPreference ? "Waiting for you →" : "You've matched" }
      </PostsItem2MetaInfo> }
      <div className={classes.dialogueRightContainer}>
        <div className={classes.dialogueMatchPreferencesButtonContainer}>
          <DialogueNextStepsButton
            isMatched={userIsMatched}
            checkId={checkId}
            targetUserId={targetUser._id}
            targetUserDisplayName={targetUser.displayName}
            currentUser={currentUser}
            matchPreference={matchPreference}
            reciprocalMatchPreference={reciprocalMatchPreference}
          />
          {!matchPreference && reciprocalMatchPreference && 
            <div className={classes.enterTopicsAnnotation}> 
              <ReactionIcon size={10} react={"agree"} /> {targetUser.displayName}
            </div>
          }
        </div>
      </div>
      <IconButton className={classes.closeIcon} onClick={() => onHide({dialogueCheckId: checkId, targetUserId: targetUser._id})}>
        <CloseIcon />
      </IconButton>
    </div>
  );
};
 
const DialoguesList = ({ currentUser, classes }: { currentUser: UsersCurrent, classes: ClassesType<typeof styles> }) => {
  const { PostsItem, SectionButton, SettingsButton, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle, DialoguesSectionFrontpageSettings, DialogueRecommendationRow, Typography } = Components
  const [showSettings, setShowSettings] = useState(false);
  const { captureEvent } = useTracking();
  const currentDate = new Date();
  const isEvenDay = currentDate.getUTCDate() % 2 === 0;
  const showReciprocityRecommendations = (currentUser.karma > 100) && isEvenDay; // hide reciprocity recommendations if user has less than 100 karma, or if the current day is not an even number (just a hack to avoid spamming folks)

  const { results: dialoguePosts } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  const { results: myDialogues } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "MyDialogues",
    limit: 3,
  });

  const renderMyDialogues = myDialogues?.length && currentUser.showMyDialogues;

  const {
    matchedUsersQueryResult: { data: matchedUsersResult },
    recommendedUsersQueryResult: { data: recommendedUsersResult },
  } = useDialogueMatchmaking(currentUser, { getMatchedUsers: true, getRecommendedUsers: true });

  const upsertUserDialogueCheck = useUpsertDialogueCheck();

  const hideRecommendation = ({dialogueCheckId, targetUserId}: {dialogueCheckId: string|undefined, targetUserId: string}) => {
    captureEvent("hide_dialogue_recommendation")
    void upsertUserDialogueCheck({ targetUserId, hideInRecommendations: true, checkId: dialogueCheckId });
  }

  const hideMatch = ({dialogueCheckId, targetUserId}: {dialogueCheckId: string|undefined, targetUserId: string}) => {
    captureEvent("hide_dialogue_frontpage_match")
    void upsertUserDialogueCheck({ targetUserId, hideInRecommendations: true, checkId: dialogueCheckId });
  }

  const matchedUsers: DialogueUserResult[] = matchedUsersResult?.GetDialogueMatchedUsers ?? [];
  const manyRecommendedUsers: DialogueUserResult[] = recommendedUsersResult?.GetDialogueRecommendedUsers ?? [];

  const neededChecksForUserIds = [...matchedUsers.map(user => user._id), ...manyRecommendedUsers.map(user => user._id)];

  const { results: userDialogueChecks = [] } = useMulti({
    terms: {
      view: "userTargetDialogueChecks",
      userId: currentUser._id,
      targetUserIds: neededChecksForUserIds
    },
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
  });

  const matchRowPropsList = getRowProps({
    currentUser,
    tableContext: 'match',
    showAgreement: false,
    showBio: false,
    showFrequentCommentedTopics: false,
    showKarma: false,
    showPostsYouveRead: false,
    userDialogueChecks,
    users: matchedUsers
  });

  const recommendedDialoguePartnersRowPropsList = manyRecommendedUsers.map(targetUser => ({targetUser, ...getUserCheckInfo(targetUser, userDialogueChecks)}))

  const dialoguesTooltip = (<div>
    <p>Dialogues between a small group of users. Click to see more.</p>
  </div>);

  const myDialoguesTooltip = (<div>
    <div>These are the dialogues you are involved in (both drafts and published)</div>
  </div>);

  const matchmakingTooltip = (<div>
    <p> Click here to go to the dialogue matchmaking page.</p>
  </div>);

  const dialogueSettingsTooltip = (<div>
    <p> Adjust which items are shown or hidden in the Dialogues section.</p>
  </div>);

  const dialogueSettingsSectionTitle = dialogueMatchmakingEnabled.get() && (
    <div className={classes.dialogueSectionSettings}>
      <LWTooltip placement="top-start" title={matchmakingTooltip}>
        <SectionButton className={classes.findDialoguePartners}>
          <MuiPeopleIcon />
          <Link to="/dialogueMatching">See all dialogue users</Link>
        </SectionButton>
      </LWTooltip>
      <LWTooltip placement="top-start" title={dialogueSettingsTooltip}>
        <SettingsButton label={``} onClick={() => setShowSettings(!showSettings)} />
      </LWTooltip>
    </div>
  );

  const dialogueSectionSettings = showSettings && (
    <DialoguesSectionFrontpageSettings
      hidden={false}
      currentShowDialogues={currentUser.showDialoguesList}
      currentShowMyDialogues={currentUser.showMyDialogues}
      currentShowMatches={currentUser.showMatches}
      currentShowRecommendedPartners={currentUser.showRecommendedPartners}
      hideReciprocityButtons={!showReciprocityRecommendations}
    />
  );

  const explanatoryNoteBox = (currentUser.showRecommendedPartners && showReciprocityRecommendations && recommendedDialoguePartnersRowPropsList.length > 0) && (
    <div className={classes.explanatoryNoteBox}>
      <Typography
        component='span'
        className={classes.explanatoryNote}
        variant='body2'>
        {<div>
          Check a user you'd maybe dialogue with. They can't see your checks unless you match. If you match, you both get to enter topics and then choose whether to dialogue. (<a className={classes.link} href="https://www.lesswrong.com/posts/d65Ax6vbNgztBE8cy/new-lesswrong-feature-dialogue-matching">Learn more</a>)
        </div>}
      </Typography>
    </div>
  );

  const userMatches = currentUser.showMatches &&
    matchRowPropsList.filter(rowProps => !rowProps.hideInRecommendations).map((rowProps, index) => (
      <DialogueMatchRow
        key={index}
        currentUser={currentUser}
        rowProps={rowProps}
        classes={classes}
        onHide={hideMatch}
      />
    ));

  const reciprocityRecommendations = (showReciprocityRecommendations && currentUser.showRecommendedPartners) &&
    recommendedDialoguePartnersRowPropsList.filter(rowProps => !rowProps.hideInRecommendations).map((rowProps, index) => (
      <DialogueRecommendationRow
        key={index}
        targetUser={rowProps.targetUser}
        checkId={rowProps.checkId}
        userIsChecked={rowProps.userIsChecked}
        userIsMatched={rowProps.userIsMatched}
        showSuggestedTopics={true}
        onHide={hideRecommendation}
      />
    ));

  const dialoguesList = currentUser.showDialoguesList && dialoguePosts?.map((post, i: number) => (
    <PostsItem
      key={post._id} post={post}
      showBottomBorder={i < dialoguePosts.length - 1}
    />
  ));

  const myDialoguesList = renderMyDialogues && (
    <div className={classes.subsection}>
      <AnalyticsContext pageSubSectionContext="myDialogues">
        <LWTooltip placement="top-start" title={myDialoguesTooltip}>
          <Link to={"/dialogues"}>
            <SectionSubtitle className={classes.subheading}>
              My Dialogues (only visible to you)
            </SectionSubtitle>
          </Link>
        </LWTooltip>
        {myDialogues?.map((post, i: number) => <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < myDialogues.length - 1} />
        )}
      </AnalyticsContext>
    </div>
  );

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      >
        {dialogueSettingsSectionTitle}
      </SectionTitle>

      {dialogueSectionSettings}
      {dialogueMatchmakingEnabled.get() && <AnalyticsContext pageSubSectionContext="frontpageDialogueMatchmaking">
        {<div>
          {explanatoryNoteBox}
          {userMatches}
          {reciprocityRecommendations}
        </div>}
      </AnalyticsContext>}
      
      {dialoguesList}
      {myDialoguesList}

   </SingleColumnSection>
  </AnalyticsContext>
}

const DialoguesListComponent = registerComponent('DialoguesList', DialoguesList, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesListComponent
  }
}
