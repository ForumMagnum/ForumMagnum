import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { gql, useQuery } from '@apollo/client';
import { useMulti } from '../../lib/crud/withMulti';
import { getRowProps } from '../users/DialogueMatchingPage';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';

const styles = (theme: ThemeType): JssStyles => ({
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
    padding: 8
  },

  dialogueMatchCheckbox: {},
  dialogueMatchUsername: {
    marginRight: 20
  },
  dialogueMatchMessageButton: {
    marginRight: 20
  },
  dialogueMatchPreferencesButton: {
    marginRight: 20
  }
});

const DialoguesList = ({ classes }: { classes: ClassesType }) => {
  const { PostsItem, DialogueCheckBox, UsersName, MessageButton, MatchDialogueButton, PostsItem2MetaInfo, SectionButton, LWTooltip, SingleColumnSection, SectionTitle, SectionSubtitle } = Components
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
    <p>Users you've already matched with for dialogues.  Click here to go to the dialogue matchmaking page.</p>
  </div>);

  const rowPropsList = currentUser && getRowProps<false>({
    currentUser,
    isUpvotedUser: false,
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
        <SectionButton>
          <Link to="/dialogueMatching">Find Dialogue Partners</Link>
        </SectionButton>
      </SectionTitle>
      
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

      {(
        <div className={classes.subsection}>
          <AnalyticsContext pageSubSectionContext="frontpageDialogueMatchmaking">
            <LWTooltip placement="top-start" title={matchmakingTooltip}>
              <Link to={"/dialogueMatching"}>
                <SectionSubtitle className={classes.subheading}>
                  Users I've Matched With
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            <div>
              {currentUser && rowPropsList?.map(rowProps => {
                const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
                return (<div key={targetUser._id} className={classes.dialogueUserRow}>
                  <div className={classes.dialogueMatchCheckbox}>
                    <DialogueCheckBox
                      targetUserId={targetUser._id}
                      targetUserDisplayName={targetUser.displayName}
                      checkId={checkId}
                      isChecked={userIsChecked}
                      isMatched={userIsMatched}
                    />
                  </div>
                  <div className={classes.dialogueMatchUsername}>
                    <PostsItem2MetaInfo>
                      <UsersName
                        className={classes.displayName}
                        documentId={targetUser._id}
                        simple={false}
                      />
                    </PostsItem2MetaInfo>
                  </div>
                  <div className={classes.dialogueMatchMessageButton}>
                    <MessageButton
                      targetUserId={targetUser._id}
                      currentUser={currentUser}
                    />
                  </div>
                  <div className={classes.dialogueMatchPreferencesButton}>
                    <MatchDialogueButton
                      isMatched={userIsMatched}
                      checkId={checkId}
                      targetUserId={targetUser._id}
                      targetUserDisplayName={targetUser.displayName}
                      currentUser={currentUser}
                    />
                  </div>
                </div>);
              })}
            </div>
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
