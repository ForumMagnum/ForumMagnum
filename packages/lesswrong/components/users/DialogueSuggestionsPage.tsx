// TODO: Import component in components.ts
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
      GetUsersWhoHaveMadeDialogues {
        

      }
        
    }
  `

function MyComponent() {
  console.log("Hi all.")

  const { loading, error, data } = useQuery(MY_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;
  console.log(data.GetUsersWhoHaveMadeDialogues) //.map(user => console.log(user._id))


  return <p> {data.GetUsersWhoHaveMadeDialogues.dialogueUsers.map(user => user.displayName) }</p>;
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
