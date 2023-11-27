import { OperationVariables, QueryResult, gql, useQuery } from "@apollo/client";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";
import {dialogueMatchmakingEnabled} from "../../lib/publicSettings";

interface MatchmakingProps {
  getMatchedUsers: boolean;
  getRecommendedUsers: boolean;
  getOptedInUsers: boolean;
  getUserDialogueChecks: boolean;
}

interface MatchmakingPropsToResultFields {
  getMatchedUsers: 'matchedUsersQueryResult';
  getRecommendedUsers: 'recommendedUsersQueryResult';
  getOptedInUsers: 'usersOptedInResult';
  getUserDialogueChecks: 'userDialogueChecksResult';
}

type IncludedProps<T extends MatchmakingProps> = {
  [k in keyof T]: T[k] extends true ? k : never;
}[keyof T];

type DialogueMatchmakingResultFields = {
  matchedUsersQueryResult: QueryResult<any, OperationVariables>;
  recommendedUsersQueryResult: QueryResult<any, OperationVariables>;
  usersOptedInResult: UseMultiResult<'UsersOptedInToDialogueFacilitation'>;
  userDialogueChecksResult: UseMultiResult<'DialogueCheckInfo'>;
};

type UseDialogueMatchmakingResults<T extends MatchmakingProps> = {
  [k in MatchmakingPropsToResultFields[IncludedProps<T> & keyof MatchmakingProps]]: DialogueMatchmakingResultFields[k]
};

export const useDialogueMatchmaking = <T extends MatchmakingProps>(props: T): UseDialogueMatchmakingResults<T> => {
  const { getMatchedUsers, getRecommendedUsers, getOptedInUsers, getUserDialogueChecks } = props; // add argument for getRecommendedUsers
  const currentUser = useCurrentUser();
  const skipByDefault = !currentUser || !dialogueMatchmakingEnabled.get();

  const matchedUsersQueryResult = useQuery(gql`
    query GetDialogueMatchedUsers {
      GetDialogueMatchedUsers {
        _id
        displayName
      }
    }
  `, { skip: skipByDefault || !getMatchedUsers });

  const recommendedUsersQueryResult = useQuery(gql`
  query GetDialogueMatchedUsers {
    GetDialogueRecommendedUsers {
      _id
      displayName
    }
  }
  `, { skip: !getRecommendedUsers || !dialogueMatchmakingEnabled.get() });

  const userDialogueChecksResult = useMulti({
    terms: {
      view: "userDialogueChecks",
      userId: currentUser?._id,
      limit: 1000,
    },
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
    skip: skipByDefault || !getUserDialogueChecks
  });

  const usersOptedInResult = useMulti({
    terms: { 
      view: 'usersWithOptedInToDialogueFacilitation',
      limit: 10, 
    },
    fragmentName: 'UsersOptedInToDialogueFacilitation',
    collectionName: 'Users',
    skip: skipByDefault || !getOptedInUsers
  });

  return {
    ...(props.getMatchedUsers ? { matchedUsersQueryResult } : {}),
    ...(props.getRecommendedUsers ? { recommendedUsersQueryResult } : {}),
    ...(props.getOptedInUsers ? { usersOptedInResult } : {}),
    ...(props.getUserDialogueChecks ? { userDialogueChecksResult }: {})
  } as UseDialogueMatchmakingResults<T>;
};
