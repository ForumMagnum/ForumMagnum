import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from '../common/withUser';
import { randomId } from '../../lib/random';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from "../../lib/crud/withMulti";

const { NewConversationButton, UsersName, PostsTooltip } = Components;

export type UpvotedUser = {
  _id: string;
  username: string;
  displayName: string;
  total_power: number;
  power_values: string;
  vote_counts: number;
  total_agreement: number;
  agreement_values: string;
};

export type CommentCountTag = {
  name: string;
  comment_count: number;
};

export type TopCommentedTagUser = {
  _id: string;
  username: string;
  displayName: string;
  total_power: number;
  tag_comment_counts: Array<{
    name: string;
    post_comment_count: number;
  }>
};

export type UserDialogueUsefulData = {
  dialogueUsers: DbUser[],
  topUsers: UpvotedUser[],
  topCommentedTags: CommentCountTag[],
  topCommentedTagTopUsers: TopCommentedTagUser[],
}


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 20,
    ...commentBodyStyles(theme),
  },
  matchContainer: {
    maxWidth: 1300,
    padding: 20,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 5,
  },
  matchContainerGrid: {
    display: 'grid', 
    gridTemplateColumns: `100px 250px minmax(min-content, 80px) 400px minmax(min-content, 80px) minmax(min-content, 80px) minmax(min-content, 60px) auto`,
    gridRowGap: '10px',
    columnGap: '10px',
  },
  header: {
    margin: 0,
    marginBottom: 10,
  },
  displayName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  button: {
    maxHeight: `30px`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.light,
    color: 'white'
  },
  link: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.light,
    }
  },
  rootFlex: {
    display: 'flex'
  },
  gradientBigTextContainer: {
    position: 'relative',
    height: '70px', 
    overflow: 'auto',
    color: 'grey', 
    fontSize: '13px',
    lineHeight: '1.3em',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
    '&.scrolled-to-bottom': {
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
    },
    '&.scrolled-to-top': {
      WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
    }
  },
  privacyNote: {
    color: 'grey',
    fontSize: '1rem',
  },
  row: {
   // borderBottom: '1px solid white',
  },
  
});

const useScrollGradient = (ref: React.RefObject<HTMLDivElement>) => {
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = ref.current;
      if (element) {
        const atTop = element.scrollTop <= (element.scrollHeight * 0.10);
        const atBottom = (element.scrollHeight - element.scrollTop) <= (element.clientHeight * 1.10);
        setIsScrolledToTop(atTop);
        setIsScrolledToBottom(atBottom);
      }
    };

    ref.current?.addEventListener('scroll', handleScroll);
    return () => ref.current?.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return { isScrolledToTop, isScrolledToBottom };
};

const UserBio = ({ classes, userId }: { classes: ClassesType, userId: string }) => {
  const { document: userData, loading } = useSingle({
    documentId: userId,
    collectionName: "Users",
    fragmentName: "UsersProfile"
  });

  const bioContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(bioContainerRef);

  return (
    <div className={`${classes.gradientBigTextContainer} ${isScrolledToTop ? 'scrolled-to-top' : ''} ${isScrolledToBottom ? 'scrolled-to-bottom' : ''}`} ref={bioContainerRef}>
      {userData?.biography?.plaintextDescription }
    </div>
  )
};

const UserPostsYouveRead = ({ classes, targetUserId }: { classes: ClassesType, targetUserId: string, components:ComponentTypes }) => {
  const currentUser = useCurrentUser();

  const { loading, error, data } = useQuery(gql`
    query UsersReadPostsOfTargetUser($userId: String!, $targetUserId: String!) {
      UsersReadPostsOfTargetUser(userId: $userId, targetUserId: $targetUserId) {
        _id
        title
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUserId },
  });

  const readPosts:[DbPost] = data?.UsersReadPostsOfTargetUser

  const readPostsContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(readPostsContainerRef);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className={`${classes.gradientBigTextContainer} ${isScrolledToTop ? 'scrolled-to-top' : ''} ${isScrolledToBottom ? 'scrolled-to-bottom' : ''}`} ref={readPostsContainerRef}>
      {readPosts.length > 0 ? (
        readPosts.slice(0, 8).map((post, index) => {
            return (
              <PostsTooltip key={index} postId={post._id}>
                <a key={index} href={"https://www.lesswrong.com/posts/gDijQHHaZzeGrv2Jc/"+post._id}>• {post.title}</a>
                <br/>
              </PostsTooltip>
            )
          })
      ) : (
        <p>(no posts read...)</p>
      )}
    </div>
  );
};


export const DialogueSuggestionsPage = ({classes}: {
  classes: ClassesType,
}) => {
  
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const [optIn, setOptIn] = React.useState(false); // for rendering the checkbox
  const updateCurrentUser = useUpdateCurrentUser()

  const {create: createPost, loading: loadingNewDialogue, error: newDialogueError} = useCreate({ collectionName: "Posts", fragmentName: "PostsEdit" });
  const { history } = useNavigation();

  const { loading, error, data } = useQuery(gql`
    query getDialogueUsers {
      GetUserDialogueUsefulData {
        dialogueUsers {
          _id
          displayName
          karma
        }
        topUsers {
          _id
          displayName
          total_power
          total_agreement
        }
       }
    }
  `);

  const userDialogueUsefulData : UserDialogueUsefulData = data?.GetUserDialogueUsefulData

  const [upsertDialogueCheck] = useMutation(gql`
    mutation upsertUserDialogueCheck($targetUserId: String!, $checked: Boolean!) {
      upsertUserDialogueCheck(targetUserId: $targetUserId, checked: $checked) {
          _id
          __typename
          userId
          targetUserId
          checked
          match
        }
      }
    `)

  const currentUser = useCurrentUser();

  // const { loading: userLoading, results } = useMulti({
  //   terms: { view: "usersProfile", slug },
  //   collectionName: "Users",
  //   fragmentName: "UsersMinimumInfo",
  //   enableTotal: false,
  //   fetchPolicy: "cache-and-network",
  // });
  // const user = getUserFromResults(results);


  const {loading: userLoading, results : userDialogueChecks} = useMulti({
    terms: {
      view: "userDialogueChecks",
      userId: currentUser?._id
    },
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
  });


  // // get all check rows where user is currentUser and checked is true
  // const GET_USERS_DIALOGUE_CHECKS = gql`
  //   query getUsersDialogueChecks {
  //     getUsersDialogueChecks {
  //       _id
  //       __typename
  //       userId
  //       targetUserId
  //       checked
  //       match
  //     }
  //   }
  // `;

  // // useMulti fetching from dialogueChecks based on a view, which takes as a usedId as an input. 
  // // permission stuff happens in the background
  
  // const { loading: loadingChecks, error: errorChecks, data: dataChecks } = useQuery(GET_USERS_DIALOGUE_CHECKS);  // for all the targetUsers thus obtained, check if there's a match 

  let targetUserIds = [];
  if (userDialogueChecks) {
    targetUserIds = userDialogueChecks.map(check => check.targetUserId);
  }

  //console.log("targetUserIds for ", currentUser?._id, targetUserIds)
  //console.log("dataMatchesfor ", currentUser?._id, dataMatches)

  
 async function updateDatabase(event:React.ChangeEvent<HTMLInputElement>, targetUserId:string, checkId?:string) {
    if (!currentUser) return;

    const response = await upsertDialogueCheck({
      variables: {
        targetUserId: targetUserId, 
        checked: event.target.checked
      },
      update(cache, { data }) {
        if (!checkId) {
          cache.modify({
            fields: {
              getUsersDialogueChecks(existingChecksRefs = []) {
                const newCheckRef = cache.writeFragment({
                  data: data.upsertUserDialogueCheck,
                  fragment: gql`
                    fragment NewCheck on DialogueChecks {
                      _id
                      __typename
                      userId
                      targetUserId
                      checked
                      match
                    }
                  `
                });
                const newData = [...existingChecksRefs, newCheckRef]
                return newData;
              }
            }
          });
        }
      },
      optimisticResponse: {
        upsertUserDialogueCheck: {
          _id: checkId || randomId(),
          __typename: 'DialogueCheck',
          userId: currentUser._id,
          targetUserId: targetUserId,
          checked: event.target.checked,
          match: false 
        }
      }
    })
    
    if (response.data.upsertUserDialogueCheck.match) {
      void handleNewMatchAnonymisedAnalytics()
    }
  }

  async function createDialogue(title: string, participants: string[]) {
    const createResult = await createPost({
      data: {
        title,
        draft: true,
        collabEditorDialogue: true,
        coauthorStatuses: participants.map(userId => ({userId, confirmed: true, requested: false})),
        shareWithUsers: participants,
        sharingSettings: {
          anyoneWithLinkCan: "none",
          explicitlySharedUsersCan: "edit",
        },
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: ""
          }
        } as AnyBecauseHard
      },
    });
    if (createResult?.data?.createPost?.data) {
      const post = createResult?.data?.createPost?.data;
      if (post) {
        const postId = post._id;
        const postEditUrl = `/editPost?postId=${postId}`;
        history.push(postEditUrl);
      }
    }
  }

  async function handleNewMatchAnonymisedAnalytics() {
    captureEvent("newDialogueReciprocityMatch", {}) // we only capture match metadata and don't pass anything else

    // ping the slack webhook to inform team of match. YOLO:ing and putting this on the client. Seems fine: but it's the second time this happens, and if we're doing it a third time, I'll properly move it all to the server 
    const webhookURL = "https://hooks.slack.com/triggers/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";
    const data = { // Not sending any data for now
    };
  
    try {
      const response = await fetch(webhookURL, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('There was a problem with the fetch operation: ', error);
    }
    
  }

  if (!currentUser) return <p>You have to be logged in to view this page</p>
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error </p>;

  const handleOptInToRevealDialogueChecks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptIn(event.target.checked);
    void updateCurrentUser({revealChecksToAdmins: event.target.checked})
    captureEvent("optInToRevealDialogueChecks", {optIn: event.target.checked})
    
    const userDetailString = currentUser?.displayName + " / " + currentUser?.slug
  
    // ping the slack webhook to inform team of opt-in. YOLO:ing and putting this on the client. Seems fine. 
    const webhookURL = "https://hooks.slack.com/triggers/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";
    const data = {
      user: userDetailString,
    };
  
    if (event.target.checked) {
      try {
        const response = await fetch(webhookURL, {
          method: 'POST',
          body: JSON.stringify(data),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error('There was a problem with the fetch operation: ', error);
      }
    }
  };

  const prompt = "Opt-in to LessWrong team viewing your checks, to help proactively suggest and facilitate dialogues" 

  return (
    <div className={classes.root}>
      <div style={{ maxWidth: '1100px', margin: 'auto' }}>

      <h1>Dialogue Matching</h1>
      <p>Check a user to you'd be interested in having a dialogue, if they were too. Users will 
        not see whether you have checked them unless they have also checked you. Currently, users will not be notified about new 
        matches, but we may add that functionality at any point.</p>
      <div style={{ height: '20px', display: 'flex', alignItems: 'top' }}>
            <FormControlLabel  style={{ paddingLeft: '8px' }}
              control={
                <Checkbox
                  checked={optIn}
                  onChange={event => handleOptInToRevealDialogueChecks(event)}
                  name="optIn"
                  color="primary"
                  style={{ height: '10px', width: '30px', color: "#9a9a9a" }}
                />
              }
              label={<span className={classes.prompt} >{prompt}</span>}
            />
          </div> 
        <p className={classes.privacyNote}>On privacy: LessWrong team does not look at user’s checks. We do track metadata, like “Two users just matched”, to help us know whether the feature is getting used. If one user opts in to revealing their checks we can still not see their matches, unless the other part of the match has also opted in.</p>      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>Your top users</h3>
          <div className={classes.matchContainerGrid}>
            <h5 className={classes.header}>Display Name</h5>
            <h5 className={classes.header}>Bio</h5>
            <h5 className={classes.header}></h5>
            <h5 className={classes.header}>Posts you've read</h5>
            <h5 className={classes.header}>Upvotes from you</h5>
            <h5 className={classes.header}>Agreement from you</h5>
            <h5 className={classes.header}>Message</h5>
            <h5 className={classes.header}></h5>
            {userDialogueUsefulData.topUsers.slice(0,20).map(targetUser => {
              const checkId = userDialogueChecks?.find(check => check.targetUserId === targetUser._id)?._id
              
              return (
                // <div className={classes.row} key={targetUser.displayName + randomId()}>
                <React.Fragment key={targetUser.displayName + randomId()}> 
                  
                    <div className={classes.displayName}><UsersName documentId={targetUser._id} simple={false}/></div>
                    <UserBio key={targetUser._id} classes={classes} userId={targetUser._id} />
                    <input 
                      type="checkbox" 
                      style={{ margin: '0', width: '20px' }} 
                      onChange={event => updateDatabase(
                        event, 
                        targetUser._id, 
                        checkId
                      )} 
                      value={targetUser.displayName} 
                      checked={userDialogueChecks?.find(check => check.targetUserId === targetUser._id)?.checked}
                    />
                    <UserPostsYouveRead classes={classes} targetUserId={targetUser._id} components={Components} />
                    <div>{targetUser.total_power}</div>
                    <div>{targetUser.total_agreement}</div>
                    {<button className={classes.button}> <NewConversationButton user={{_id: targetUser._id}} currentUser={currentUser}>
                        <a data-cy="message">Message</a>
                    </NewConversationButton> </button>}
                    <div>
                      {userDialogueChecks &&
                        userDialogueChecks.some(check => check.targetUserId === targetUser._id && check.match) ? <div>
                          <span>You match!</span>
                          <a className={classes.link} onClick={e => createDialogue(`${currentUser?.displayName}/${targetUser.displayName}`, [targetUser._id])}> {loadingNewDialogue ? "Creating new Dialogue..." : "Start Dialogue"} </a>
                        </div> : null}
                    </div>
                 
                </React.Fragment> 
                // </div>
              )}
            )}
          </div>
        </div>
      </div>
      <br />
      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>All users who have published Dialogues</h3>
          <div className={classes.matchContainerGrid}>
            <h5 className={classes.header}>Display Name</h5>
            <h5 className={classes.header}>Bio</h5>
            <h5 className={classes.header}>Posts you've read</h5>
            <h5 className={classes.header}>Opt-in to dialogue</h5>
            <h5 className={classes.header}>Karma</h5>
            <h5 className={classes.header}>Karma again</h5>
            <h5 className={classes.header}>Message</h5>
            <h5 className={classes.header}>Match</h5>
            {userDialogueUsefulData.dialogueUsers.map(targetUser => {
              const checkId = userDialogueChecks?.find(check => check.targetUserId === targetUser._id)?._id
              
              return (
                <React.Fragment key={targetUser.displayName + randomId()}>
                  <div className={classes.displayName}><UsersName documentId={targetUser._id} simple={false}/></div>
                  <UserBio key={targetUser._id} classes={classes} userId={targetUser._id} />
                  <input 
                    type="checkbox" 
                    style={{ margin: '0', width: '20px' }} 
                    onChange={event => updateDatabase(
                      event, 
                      targetUser._id, 
                      checkId
                    )} 
                    value={targetUser.displayName} 
                    checked={userDialogueChecks?.find(check => check.targetUserId === targetUser._id)?.checked}
                  />
                  <UserPostsYouveRead classes={classes} targetUserId={targetUser._id} />
                  <div>{targetUser.karma}</div>
                  <div>{targetUser.karma}</div>
                  {<button className={classes.button}> <NewConversationButton user={{_id: targetUser._id}} currentUser={currentUser}>
                      <a data-cy="message">Message</a>
                  </NewConversationButton> </button>}
                  <div>
                    {userDialogueChecks &&
                      userDialogueChecks.some(check => check.targetUserId === targetUser._id && check.match) ? <div>
                        <span>You match!</span>
                        <a className={classes.link} onClick={e => createDialogue(`${currentUser?.displayName}/${targetUser.displayName}`, [targetUser._id])}> {loadingNewDialogue ? "Creating new Dialogue..." : "Start Dialogue"} </a>
                      </div> : null}
                  </div>
                </React.Fragment>
              )}
            )}
          </div>
        </div>
      </div>
      {/* <h2>All users who had dialogues</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0px' }}>
        <h5>Display Name</h5>
        <h5>Opt-in to dialogue</h5>
        <h5>Message</h5>
        {[...new Map(userDialogueUsefulData.dialogueUsers.map(user => [user.displayName, user])).values()].map(user => (
          <React.Fragment key={user.displayName}>
            <p style={{ margin: '3px' }}>{user.displayName}</p>
            <input type="checkbox" style={{ margin: '0' }} />
            <button>Message</button>
          </React.Fragment>
        ))}
      </div>  */}

      {/* <h2>Your top tags</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0px' }}>
        <h5>Tag Name</h5>
        <h5>Comment Count</h5>
        <h5>Opt-in to dialogue</h5>
        {userDialogueUsefulData.topCommentedTags.slice(0,20).map(tag => (
          <React.Fragment key={tag.name}>
            <p style={{ margin: '3px' }}>{tag.name}</p>
            <p style={{ margin: '3px' }}>{tag.comment_count}</p>
            <input type="checkbox" style={{ margin: '0' }} />
          </React.Fragment>
        ))}
      </div> */}

      {/* <h2>Your top tags top users</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0px' }}>
        <h5>Username</h5>
        <h5>Total Power</h5>
        <h5>Tag Comment Counts</h5>
        {userDialogueUsefulData.topCommentedTagTopUsers.map(user => (
          <React.Fragment key={user.username}>
            <p style={{ margin: '0' }}>{user.username}</p>
            <p style={{ margin: '0' }}>{user.total_power}</p>
            <p style={{ margin: '0' }}>{user.tag_comment_counts}</p>
          </React.Fragment>
        ))}
      </div> */}
      </div>
    </div>
  );
}

const DialogueSuggestionsPageComponent = registerComponent('DialogueSuggestionsPage', DialogueSuggestionsPage, {styles});

declare global {
  interface ComponentTypes {
    DialogueSuggestionsPage: typeof DialogueSuggestionsPageComponent
  }
}
