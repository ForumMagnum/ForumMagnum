import { OperationVariables, QueryResult, gql, useQuery } from "@apollo/client";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";
import {dialogueMatchmakingEnabled} from "../../lib/publicSettings";

interface MatchmakingProps {
  getMatchedUsers: boolean;
  getOptedInUsers: boolean;
  getUserDialogueChecks: boolean;
}

interface MatchmakingPropsToResultFields {
  getMatchedUsers: 'matchedUsersQueryResult';
  getOptedInUsers: 'usersOptedInResult';
  getUserDialogueChecks: 'userDialogueChecksResult';
}

type IncludedProps<T extends MatchmakingProps> = {
  [k in keyof T]: T[k] extends true ? k : never;
}[keyof T];

type DialogueMatchmakingResultFields = {
  matchedUsersQueryResult: QueryResult<any, OperationVariables>;
  usersOptedInResult: UseMultiResult<'UsersOptedInToDialogueFacilitation'>;
  userDialogueChecksResult: UseMultiResult<'DialogueCheckInfo'>;
};

type UseDialogueMatchmakingResults<T extends MatchmakingProps> = {
  [k in MatchmakingPropsToResultFields[IncludedProps<T> & keyof MatchmakingProps]]: DialogueMatchmakingResultFields[k]
};

export const useDialogueMatchmaking = <T extends MatchmakingProps>(props: T): UseDialogueMatchmakingResults<T> => {
  const { getMatchedUsers, getOptedInUsers, getUserDialogueChecks } = props;
  const currentUser = useCurrentUser();

  const matchedUsersQueryResult = useQuery(gql`
    query GetDialogueMatchedUsers {
      GetDialogueMatchedUsers {
        _id
        displayName
      }
    }
  `, { skip: !getMatchedUsers || !dialogueMatchmakingEnabled.get() });

  const userDialogueChecksResult = useMulti({
    terms: {
      view: "userDialogueChecks",
      userId: currentUser?._id,
      limit: 1000,
    },
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
    skip: !getUserDialogueChecks || !dialogueMatchmakingEnabled.get()
  });

  const usersOptedInResult = useMulti({
    terms: { 
      view: 'usersWithOptedInToDialogueFacilitationOrCheckedAnyBoxes',
      limit: 10, 
    },
    fragmentName: 'UsersOptedInToDialogueFacilitationOrCheckedAnyBoxes',
    collectionName: 'Users',
    skip: !getOptedInUsers || !dialogueMatchmakingEnabled.get()
  });

  return {
    ...(props.getMatchedUsers ? { matchedUsersQueryResult } : {}),
    ...(props.getOptedInUsers ? { usersOptedInResult } : {}),
    ...(props.getUserDialogueChecks ? { userDialogueChecksResult }: {})
  } as UseDialogueMatchmakingResults<T>;
};
