import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { DialogueUserRowProps, getRowProps } from '../users/DialogueMatchingPage';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';
import MuiPeopleIcon from "@material-ui/icons/People";
import {dialogueMatchmakingEnabled} from '../../lib/publicSettings';
import {useABTest} from '../../lib/abTestImpl';
import {frontpageDialogueReciprocityRecommendations, showTopicsInReciprocity} from '../../lib/abTests';


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

  dialogueUserRow: { // shared imports?
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
  dialogueMatchPreferencesButton: {
    marginLeft: 8,
    marginRight: 0
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
  }
});

interface DialogueMatchRowProps {
  rowProps: DialogueUserRowProps<boolean>; 
  classes: ClassesType<typeof styles>; 
  showMatchNote: boolean;
}

const DialogueMatchRow = ({ rowProps, classes, showMatchNote }: DialogueMatchRowProps) => {
  const { DialogueCheckBox, UsersName, MessageButton, DialogueNextStepsButton, PostsItem2MetaInfo } = Components

  const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
  const currentUser = useCurrentUser();
  if (!currentUser) return <></>;

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
      <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
        {showMatchNote ? "You've matched!" : "Check to opt in to dialogue, if you find a topic"}
      </PostsItem2MetaInfo>
      <div className={classes.dialogueRightContainer}>
        <div className={classes.dialogueMatchPreferencesButton}>
          <DialogueNextStepsButton
            isMatched={userIsMatched}
            checkId={checkId}
            targetUserId={targetUser._id}
            targetUserDisplayName={targetUser.displayName}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};
 
const DialoguesList = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { PostsItem, SectionButton, SettingsButton, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle, DialoguesSectionFrontpageSettings, DialogueRecommendationRow, Typography } = Components
  const currentUser = useCurrentUser()
  const [showSettings, setShowSettings] = useState(false);
  const showReciprocityRecommendations = (useABTest(frontpageDialogueReciprocityRecommendations) === "show")
  const showTopics = (useABTest(showTopicsInReciprocity) === "show")

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

  const {
    matchedUsersQueryResult: { data: matchedUsersResult },
    recommendedUsersQueryResult: { data: recommendedUsersResult },
    userDialogueChecksResult: { results: userDialogueChecks = [] },
  } = useDialogueMatchmaking({ getMatchedUsers: true, getRecommendedUsers: true, getOptedInUsers: false, getUserDialogueChecks: true });

  const matchedUsers: UsersOptedInToDialogueFacilitation[] | undefined = matchedUsersResult?.GetDialogueMatchedUsers;

  const matchRowPropsList = currentUser && getRowProps({
    currentUser,
    tableContext: 'match',
    showAgreement: false,
    showBio: false,
    showFrequentCommentedTopics: false,
    showKarma: false,
    showPostsYouveRead: false,
    userDialogueChecks,
    users: matchedUsers ?? []
  });

  const manyRecommendedUsers: DbUser[] | undefined = recommendedUsersResult?.GetDialogueRecommendedUsers;

  const recommendedDialoguePartnersRowPropsList = currentUser && getRowProps({
    currentUser,
    tableContext: 'other', 
    showAgreement: false,
    showBio: false,
    showFrequentCommentedTopics: false,
    showKarma: false,
    showPostsYouveRead: false,
    userDialogueChecks,
    users: manyRecommendedUsers ?? []
  });

  const dialoguesTooltip = (<div>
    <p>Dialogues between a small group of users. Click to see more.</p>
  </div>);

  const renderMyDialogues = !!currentUser && myDialogues?.length 

  const myDialoguesTooltip = (<div>
    <div>These are the dialogues you are involved in (both drafts and published)</div>
  </div>);

  const matchmakingTooltip = (<div>
    <p> Click here to go to the dialogue matchmaking page.</p>
  </div>);

  const dialogueSettingsTooltip = (<div>
    <p> Adjust which items are shown or hidden in the Dialogues section.</p>
  </div>);

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      >
      {currentUser && dialogueMatchmakingEnabled.get() && (
        <div className={classes.dialogueSectionSettings}>
          <LWTooltip placement="top-start" title={matchmakingTooltip}>
            <SectionButton className={classes.findDialoguePartners}>
              <MuiPeopleIcon />
              <Link to="/dialogueMatching">See all dialogue users</Link>
            </SectionButton>
          </LWTooltip>
          <LWTooltip placement="top-start" title={dialogueSettingsTooltip}>
            <SettingsButton label={``} onClick={() => setShowSettings(!showSettings)}/>
          </LWTooltip>
        </div>
      )}
      
      </SectionTitle>
      {showSettings && currentUser && <DialoguesSectionFrontpageSettings
          persistentSettings={true}
          hidden={false}
          currentShowDialogues={currentUser.showDialoguesList}
          currentShowMyDialogues={currentUser.showMyDialogues}
          currentShowMatches={currentUser.showMatches}
          currentShowRecommendedPartners={currentUser.showRecommendedPartners}
          hideReciprocityButtons={!showReciprocityRecommendations}
        />}

      {dialogueMatchmakingEnabled.get() && <AnalyticsContext pageSubSectionContext="frontpageDialogueMatchmaking">
        {showReciprocityRecommendations && <div>
          { (currentUser?.showMatches || currentUser?.showRecommendedPartners ) &&
            <div className={classes.explanatoryNoteBox}>
              <Typography
                component='span'
                className={classes.explanatoryNote}
                variant='body2'>
                  {<div>
                    Check a user you'd maybe dialogue with. They can't see your checks unless you match. If you match, you both get to enter topics and then choose whether to dialogue. (<a className={classes.link} href="https://www.lesswrong.com/posts/d65Ax6vbNgztBE8cy/new-lesswrong-feature-dialogue-matching">Learn more</a>)
                    </div>}
              </ Typography>
            </div>}
          {currentUser?.showMatches && matchRowPropsList?.map((rowProps, index) => (
            <DialogueMatchRow key={index} rowProps={rowProps} classes={classes} showMatchNote={true} />
          ))}
          {currentUser?.showRecommendedPartners && recommendedDialoguePartnersRowPropsList?.map((rowProps, index) => (
            <DialogueRecommendationRow key={index} rowProps={rowProps} showSuggestedTopics={showTopics} />
          ))}
        </div>}
      </AnalyticsContext>}
      
      {(!currentUser || currentUser?.showDialoguesList) && dialoguePosts?.map((post, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}

      {renderMyDialogues && currentUser?.showMyDialogues && (
        <div className={classes.subsection}>
          <AnalyticsContext pageSubSectionContext="myDialogues">
            <LWTooltip placement="top-start" title={myDialoguesTooltip}>
              <Link to={"/dialogues"}>
                <SectionSubtitle className={classes.subheading}>
                  My Dialogues (only visible to you)
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            {myDialogues?.map((post, i: number) =>
              <PostsItem
                key={post._id} post={post}
                showBottomBorder={i < myDialogues.length-1}
              />
            )}
          </AnalyticsContext>
        </div>
      )}

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
