import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useCurrentUser } from '../common/withUser';
import { randomId } from '../../lib/random';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 20,
    ...commentBodyStyles(theme),
  },
  grid: {
    display: 'grid', 
    gridTemplateColumns: `130px minmax(min-content, 80px) minmax(min-content, 80px) minmax(min-content, 80px) minmax(min-content, 60px) auto`,
    rowGap: '2px',
    columnGap: '10px'
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
  }
});

export const DialogueSuggestionsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { NewConversationButton } = Components;
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const {create: createPost, loading: loadingNewDialogue, error: newDialogueError} = useCreate({ collectionName: "Posts", fragmentName: "PostsEdit" });
  const { history } = useNavigation();
  const { loading, error, data } = useQuery(gql`
    query getDialogueUsers {
      GetUsersWhoHaveMadeDialogues
    }
  `);

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

  // get all check rows where user is currentUser and checked is true
  const GET_USERS_DIALOGUE_CHECKS = gql`
    query getUsersDialogueChecks {
      getUsersDialogueChecks {
        _id
        __typename
        userId
        targetUserId
        checked
        match
      }
    }
  `;
  const { loading: loadingChecks, error: errorChecks, data: dataChecks } = useQuery(GET_USERS_DIALOGUE_CHECKS);
  // for all the targetUsers thus obtained, check if there's a match 

  let targetUserIds = [];
  if (dataChecks && dataChecks.getUsersDialogueChecks) {
    targetUserIds = dataChecks.getUsersDialogueChecks.map(check => check.targetUserId);
  }

  //console.log("targetUserIds for ", currentUser?._id, targetUserIds)
  //console.log("dataMatchesfor ", currentUser?._id, dataMatches)

  
 async function updateDatabase(e, targetUserId:string, checkId?:string) {
    console.log({ targetUserId, checkId })
    if (!currentUser) return;

    const response = await upsertDialogueCheck({
      variables: {
        targetUserId: targetUserId, 
        checked: e.target.checked
      },
      update(cache, { data }) {
        console.log("calling Update", { checkId, data})
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
          checked: e.target.checked,
          match: false 
        }
      }
    })
    
    if (response.data.upsertUserDialogueCheck.match) {
      void handleNewMatchAnonymisedAnalytics()
    }
  }

  async function createDialogue(title: string, participants: string[]) {
    console.log({ participants })
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
  if (error || errorChecks) return <p>Error </p>;

  console.log({ dataChecks })

  return (
    <div className={classes.root}>
      <h1>Dialogue Reciprocity</h1>
        <p>Blah blah here's how dialogues matchmaking works. LessWrong team looks at metadata analytics</p>
        <br />
      <h3>Your top users</h3>
      <div className={classes.grid}>
        <h5 className={classes.header}>Display Name</h5>
        <h5 className={classes.header}>Opt-in to dialogue</h5>
        <h5 className={classes.header}>Upvotes from you</h5>
        <h5 className={classes.header}>Agreement from you</h5>
        <h5 className={classes.header}>Message</h5>
        <h5 className={classes.header}>Match</h5>
        {data.GetUsersWhoHaveMadeDialogues.topUsers.slice(0,50).map(targetUser => (
          <React.Fragment key={targetUser.displayName + randomId()}>
            <div className={classes.displayName}>{targetUser.displayName}</div>
            <input 
              type="checkbox" 
              style={{ margin: '0', width: '20px' }} 
              onChange={event => updateDatabase(event, targetUser._id, dataChecks.getUsersDialogueChecks.find(check => check.targetUserId === targetUser._id)?._id)} 
              value={targetUser.displayName} 
              checked={dataChecks && dataChecks.getUsersDialogueChecks.find(check => check.targetUserId === targetUser._id)?.checked}
            />
            <div>{targetUser.total_power}</div>
            <div>{targetUser.total_agreement}</div>
            {<button className={classes.button}> <NewConversationButton user={{_id: targetUser._id}} currentUser={currentUser}>
                <a data-cy="message">Message</a>
            </NewConversationButton> </button>}
            <div>
              {dataChecks &&
                dataChecks.getUsersDialogueChecks.some(check => check.targetUserId === targetUser._id && check.match) ? <div>
                  <span>You match!</span>
                  <a className={classes.link} onClick={e => createDialogue(`${currentUser?.displayName}/${targetUser.displayName}`, [targetUser._id])}> {loadingNewDialogue ? "Creating new Dialogue..." : "Start Dialogue"} </a>
                </div> : null}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* <h2>All users who had dialogues</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0px' }}>
        <h5>Display Name</h5>
        <h5>Opt-in to dialogue</h5>
        <h5>Message</h5>
        {[...new Map(data.GetUsersWhoHaveMadeDialogues.dialogueUsers.map(user => [user.displayName, user])).values()].map(user => (
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
        {data.GetUsersWhoHaveMadeDialogues.topCommentedTags.slice(0,20).map(tag => (
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
        {data.GetUsersWhoHaveMadeDialogues.topCommentedTagTopUsers.map(user => (
          <React.Fragment key={user.username}>
            <p style={{ margin: '0' }}>{user.username}</p>
            <p style={{ margin: '0' }}>{user.total_power}</p>
            <p style={{ margin: '0' }}>{user.tag_comment_counts}</p>
          </React.Fragment>
        ))}
      </div> */}
    </div>
  );
}

const DialogueSuggestionsPageComponent = registerComponent('DialogueSuggestionsPage', DialogueSuggestionsPage, {styles});

declare global {
  interface ComponentTypes {
    DialogueSuggestionsPage: typeof DialogueSuggestionsPageComponent
  }
}
