import React from 'react';
import { fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import ConversionHelpers from '@ckeditor/ckeditor5-engine/src/conversion/conversionhelpers';
import { gql, useQuery, useMutation } from "@apollo/client";
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});



function MyComponent() {

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
      }
    }
  `;
  const { loading: loadingChecks, error: errorChecks, data: dataChecks } = useQuery(GET_USERS_DIALOGUE_CHECKS);
  // for all the targetUsers thus obtained, check if there's a match 
  const GET_MATCHED_USERS = gql`
    query getMatchedUsers($targetUserIds: [String!]!) {
      getMatchedUsers(targetUserIds: $targetUserIds) {
        _id
        __typename
        userId
        targetUserId
        checked
      }
    }
  `;
  console.log("dataChecks", dataChecks)

  let targetUserIds = [];
  if (dataChecks && dataChecks.getUsersDialogueChecks) {
    targetUserIds = dataChecks.getUsersDialogueChecks.map(check => check.targetUserId);
  }

  const { loading: loadingMatches, error: errorMatches, data: dataMatches } = useQuery(GET_MATCHED_USERS, {
    variables: { targetUserIds },
  });

  //console.log("targetUserIds for ", currentUser?._id, targetUserIds)
  //console.log("dataMatchesfor ", currentUser?._id, dataMatches)

  
 function updateDatabase(e, targetUserId:string, checkId:string) {
    if (!currentUser) return;

    console.log("checkbox value ", e.target.checked)

    void upsertDialogueCheck({
      variables: {
        targetUserId: targetUserId, 
        checked: e.target.checked
      },
      optimisticResponse: {
        upsertUserDialogueCheck: {
          _id: checkId,
          __typename: 'DialogueCheck',
          userId: currentUser._id,
          targetUserId: targetUserId,
          checked: e.target.checked,
        }
      }
  })
  }

  if (loading || loadingChecks || loadingMatches) return <p>Loading...</p>;
  if (error || errorChecks || errorMatches) return <p>Error </p>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Your top users</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '0px' }}>
        <h3>Display Name</h3>
        <h3>Total upvotes from you</h3>
        <h3>Total agreement from you</h3>
        <h3>Opt-in to dialogue</h3>
        <h3>Message</h3>
        <h3>Match</h3>
        {data.GetUsersWhoHaveMadeDialogues.topUsers.slice(0,50).map(targetUser => (
          <React.Fragment key={targetUser.displayName}>
            <p style={{ margin: '3px' }}>{targetUser.displayName}</p>
            <p style={{ margin: '3px' }}>{targetUser.total_power}</p>
            <p style={{ margin: '3px' }}>{targetUser.total_agreement}</p>
            <input 
              type="checkbox" 
              style={{ margin: '0' }} 
              onChange={event => updateDatabase(event, targetUser._id, dataChecks.getUsersDialogueChecks.find(check => check.targetUserId === targetUser._id)?._id)} 
              value={targetUser.displayName} 
              checked={dataChecks && dataChecks.getUsersDialogueChecks.some(check => check.targetUserId === targetUser._id)}
            />
            <button>Message</button>
            <p>
              {dataMatches &&
                dataMatches.getMatchedUsers.some(match => match.userId === targetUser?._id) ? (
                  <span>You match!</span>
                ) : null}
            </p>
          </React.Fragment>
        ))}
      </div>

      {/* <h2>All users who had dialogues</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0px' }}>
        <h3>Display Name</h3>
        <h3>Opt-in to dialogue</h3>
        <h3>Message</h3>
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
        <h3>Tag Name</h3>
        <h3>Comment Count</h3>
        <h3>Opt-in to dialogue</h3>
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
        <h3>Username</h3>
        <h3>Total Power</h3>
        <h3>Tag Comment Counts</h3>
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

export const DialogueSuggestionsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  return <div className={classes.root}>
    <MyComponent />

  </div>;
}

const DialogueSuggestionsPageComponent = registerComponent('DialogueSuggestionsPage', DialogueSuggestionsPage, {styles});

declare global {
  interface ComponentTypes {
    DialogueSuggestionsPage: typeof DialogueSuggestionsPageComponent
  }
}
