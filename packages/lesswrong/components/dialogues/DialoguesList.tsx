import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { DialogueUserRowProps, ExtendedDialogueMatchPreferenceTopic, getRowProps } from '../users/DialogueMatchingPage';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';
import MuiPeopleIcon from "@material-ui/icons/People";
import {dialogueMatchmakingEnabled} from '../../lib/publicSettings';
import {gql, useQuery} from '@apollo/client';
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

  closeIcon: {
    color: theme.palette.grey[300],
    position: 'absolute', 
    right: '8px',
    top: '8px',
    padding: '2px',
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
    // maxWidth: 95,
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
    marginRight: 0 //3
  },
  dialogueNoMatchesButton: {
    marginLeft: 8
  },
  debateTopicExpanded: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingBottom: '10px',
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal'
    }
  },
  debateTopicCollapsed: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal',
      paddingBottom: '10px'
    },
    whiteSpace: 'nowrap',
  },
  topicRecommendationsList: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
    fontSize: 'small',
    overflow: 'hidden',
    justifyContent: 'space-between'
  },
  expandIcon: {
    cursor: 'pointer',
    minWidth: '70px',
    color: 'grey',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  hideIcon: {
    cursor: 'pointer',
    minWidth: '70px',
    color: 'grey',
    fontFamily: theme.palette.fonts.sansSerifStack,

  },
  recommendationReasons: {
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 4,
    marginLeft: 'auto',
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.05)",
    whiteSpace: 'nowrap'
  },
  dialogueSectionSettings: {
    display: "flex",
  },
  settingsButton: {
    cursor: "pointer"
  },
  findDialoguePartners: {
    paddingRight: 5,
  },
  reactIcon: {
    paddingRight: "4px",
  },
  suggestionRow: {
    display: 'flex',
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
        {/* <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
          {showMatchNote ? "You've matched!" : "Check to opt in to dialogue, if you find a topic"}
        </PostsItem2MetaInfo> */}
      </div>
      <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
        {showMatchNote ? "You've matched!" : "Check to opt in to dialogue, if you find a topic"}
      </PostsItem2MetaInfo>
      <div className={classes.dialogueRightContainer}>
        {/* <div className={classes.dialogueMatchMessageButton}>
          <MessageButton
            targetUserId={targetUser._id}
            currentUser={currentUser}
            isMatched={userIsMatched}
          />
        </div> */}
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

interface DialogueRecommendationRowProps {
  rowProps: DialogueUserRowProps<boolean>; 
  classes: ClassesType<typeof styles>; 
  showSuggestedTopics: boolean;
}

const DialogueRecommendationRow = ({ rowProps, classes, showSuggestedTopics }: DialogueRecommendationRowProps) => {
  const { DialogueCheckBox, UsersName, MessageButton, DialogueNextStepsButton, PostsItem2MetaInfo, LWTooltip, ReactionIcon } = Components

  const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
  const currentUser = useCurrentUser();
  // Dummy sentences for debate topics
  // const debateTopics = ["Example sentence 1", "Example sentence 2", "Example sentence 3"];

  // State to handle the expansion of the text
  const [isExpanded, setIsExpanded] = useState(false);


  const { loading, error, data: topicData } = useQuery(gql`
    query getTopicRecommendations($userId: String!, $targetUserId: String!, $limit: Int!) {
      GetTwoUserTopicRecommendations(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        comment {
          _id
          contents {
            html
            plaintextMainText
          }
        }
        recommendationReason
        yourVote
        theirVote
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit:4 },
  });

  if (!currentUser) return <></>;
  // const topicRecommendations: ExtendedDialogueMatchPreferenceTopic[] | undefined = topicData?.GetTwoUserTopicRecommendations; // Note CommentsList is too permissive here, but making my own type seemed too hard  
  const topicRecommendations: {comment: {_id: string, contents: {html: string, plaintextMainText: string}}, recommendationReason: string, yourVote: string, theirVote: string}[] | undefined = topicData?.GetTwoUserTopicRecommendations; 
 // const topicRecommendations = preTopicRecommendations?.filter(topic => topic.theirVote !== null);

  //console.log(topicRecommendations);
  //console.log(topicRecommendations?.map(topic => ({name: targetUser.displayName, theirVote: topic.theirVote, content: topic.comment.contents.plaintextMainText}) ));

  // Function to toggle the expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const numRecommendations = topicRecommendations?.length || 0;
  const numShown = isExpanded ? numRecommendations : 1
  const numHidden = Math.max(0, numRecommendations - numShown);

  return (
    <div>
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
          {/* <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
            Topic suggestions
          </PostsItem2MetaInfo> */}
        </div>
        {showSuggestedTopics && <div className={classes.topicRecommendationsList}>
          {topicRecommendations?.slice(0,numShown).map((topic, index) => (
            <div key={index} className={classes.suggestionRow}>
              <p key={index} className={ isExpanded ? classes.debateTopicExpanded : classes.debateTopicCollapsed}>
                {topic.theirVote === 'agree' ? 
                  [<ReactionIcon key={index} size={13} react={"agree"} />, `agrees that "${topic.comment.contents.plaintextMainText}"`] : 
                  [<ReactionIcon key={index} size={13} react={"disagree"} />, `disagrees that "${topic.comment.contents.plaintextMainText}"`]
                }
              </p>
            </div>
          ))}
          
      </div>}
      <div className={classes.dialogueRightContainer}>
        {<span className={isExpanded ? classes.expandIcon : classes.hideIcon} onClick={toggleExpansion}>
          {isExpanded ? '▲ hide' : (numHidden > 0 ? `▶ ...more` : '')} 
        </span>}
      </div>
      {!showSuggestedTopics && 
        <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
          <div className={classes.dialogueMatchNote}>Check to maybe dialogue, if you find a topic</div>
        </PostsItem2MetaInfo>}
      </div>
    </div>
  );
};
 
const DialoguesList = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { PostsItem, SectionButton, SettingsButton, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle, DialoguesSectionFrontpageSettings } = Components
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

  const matchedUserIds = matchedUsers?.map(user => user._id) || [];
  const checkedUserIds = userDialogueChecks.map(check => check._id);

  const filteredRecommendedUsers = manyRecommendedUsers?.filter(targetUser => 
    !matchedUserIds.includes(targetUser._id) && !checkedUserIds.includes(targetUser._id)
  );

  let recommendedUsers:DbUser[] = []
  if (filteredRecommendedUsers) {
    const sampleSize = 3;
    const shuffled = filteredRecommendedUsers.sort(() => 0.5 - Math.random());
    recommendedUsers = shuffled.slice(0, sampleSize);
  }

  const recommendedDialoguePartnersRowPropsList = currentUser && getRowProps({
    currentUser,
    tableContext: 'match', // TODO: change
    showAgreement: false,
    showBio: false,
    showFrequentCommentedTopics: false,
    showKarma: false,
    showPostsYouveRead: false,
    userDialogueChecks,
    users: recommendedUsers ?? []
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
              <Link to="/dialogueMatching">Find Dialogue Partners</Link>
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
        <div>
        {currentUser?.showMatches && showReciprocityRecommendations && matchRowPropsList?.map((rowProps, index) => (
          <DialogueMatchRow key={index} rowProps={rowProps} classes={classes} showMatchNote={true} />
        ))}
        {currentUser?.showRecommendedPartners && showReciprocityRecommendations && recommendedDialoguePartnersRowPropsList?.map((rowProps, index) => (
          <DialogueRecommendationRow key={index} rowProps={rowProps} classes={classes} showSuggestedTopics={showTopics} />
        ))}
        </div>
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
