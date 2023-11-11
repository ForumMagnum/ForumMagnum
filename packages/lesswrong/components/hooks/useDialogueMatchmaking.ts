import { gql, useQuery } from "@apollo/client";
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";

export const useDialogueMatchmaking = () => {
  const currentUser = useCurrentUser();

  const matchedUsersQueryResult = useQuery(gql`
    query GetDialogueMatchedUsers {
      GetDialogueMatchedUsers {
        _id
        displayName
      }
    }
  `);

  const userDialogueChecksResult = useMulti({
    terms: {
      view: "userDialogueChecks",
      userId: currentUser?._id,
      limit: 1000,
    },
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
  });

  const usersOptedInResult = useMulti({
    terms: { 
      view: 'usersWithOptedInToDialogueFacilitation',
      limit: 10, 
    },
    fragmentName: 'UsersOptedInToDialogueFacilitation',
    collectionName: 'Users'  
  });

  return {
    matchedUsersQueryResult,
    userDialogueChecksResult,
    usersOptedInResult
  };
};
