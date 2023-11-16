import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { getRowProps } from '../users/DialogueMatchingPage';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';
import MuiPeopleIcon from "@material-ui/icons/People";
import {dialogueMatchmakingEnabled} from '../../lib/publicSettings';


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
    color: "#e0e0e0",
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
    width: '100%',
    alignItems: 'left',
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
    maxWidth: 95,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
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
    marginRight: 3
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
  findDialoguePartners: {
  }
});

const DialoguesList = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { PostsItem, DialogueCheckBox, UsersName, MessageButton, DialogueNextStepsButton, PostsItem2MetaInfo, SectionButton, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle } = Components
  const currentUser = useCurrentUser()

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
    userDialogueChecksResult: { results: userDialogueChecks = [] },
  } = useDialogueMatchmaking({ getMatchedUsers: true, getOptedInUsers: false, getUserDialogueChecks: true });

  const matchedUsers: UsersOptedInToDialogueFacilitation[] | undefined = matchedUsersResult?.GetDialogueMatchedUsers;

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

  const rowPropsList = currentUser && getRowProps({
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

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      >
      {currentUser && dialogueMatchmakingEnabled.get() && (
        <LWTooltip placement="top-start" title={matchmakingTooltip}>
          <SectionButton className={classes.findDialoguePartners}>
            <MuiPeopleIcon />
            <Link to="/dialogueMatching">Find Dialogue Partners</Link>
          </SectionButton>
        </LWTooltip>
      )}
      </SectionTitle>

      {dialogueMatchmakingEnabled.get() && <AnalyticsContext pageSubSectionContext="frontpageDialogueMatchmaking">
        <div>
          {currentUser && rowPropsList?.map(rowProps => {
            const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
            return (<div key={targetUser._id} className={classes.dialogueUserRow}>
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
                <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
                  You've matched with this user
                </PostsItem2MetaInfo>
              </div>
              <div className={classes.dialogueRightContainer}>
                <div className={classes.dialogueMatchMessageButton}>
                  <MessageButton
                    targetUserId={targetUser._id}
                    currentUser={currentUser}
                    isMatched={userIsMatched}
                  />
                </div>
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
            </div>);
          })}
        </div>
      </AnalyticsContext>}
      
      {dialoguePosts?.map((post, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}

      {renderMyDialogues && (
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
