import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import ConversionHelpers from '@ckeditor/ckeditor5-engine/src/conversion/conversionhelpers';
import { gql, useQuery } from "@apollo/client";

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

// const MY_QUERY = gql`
//   query MyQuery {
//     myField {
//       subField
//     }
//   }
// `;

const MY_QUERY = gql`
  query getDialogueUsers {
    GetUsersWhoHaveMadeDialogues
  }
`
//       dialogueUsers {
//         displayName
//       }
     
//       topUsers {
//         total_power
//         total_agreement
//       }

//       topCommentedTags {
//         name
//         comment_count
//       }

//       topCommentedTagTopUsers {
//         username
        
//         tag_comment_counts
//       }
//     }
//   }
// `

function MyComponent() {

  const { loading, error, data } = useQuery(MY_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error </p>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Your top users</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0px' }}>
        <h3>Display Name</h3>
        <h3>Total upvotes from you</h3>
        <h3>Total agreement from you</h3>
        <h3>Opt-in to dialogue</h3>
        <h3>Message</h3>
        {data.GetUsersWhoHaveMadeDialogues.topUsers.slice(0,20).map(user => (
          <React.Fragment key={user.displayName}>
            <p style={{ margin: '3px' }}>{user.displayName}</p>
            <p style={{ margin: '3px' }}>{user.total_power}</p>
            <p style={{ margin: '3px' }}>{user.total_agreement}</p>
            <input type="checkbox" style={{ margin: '0' }} />
            <button>Message</button>
          </React.Fragment>
        ))}
      </div>

      <h2>All users who had dialogues</h2>
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
      </div> 

      <h2>Your top tags</h2>
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
      </div>

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
