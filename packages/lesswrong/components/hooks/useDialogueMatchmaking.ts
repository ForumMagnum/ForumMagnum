import { OperationVariables, QueryResult, gql, useQuery } from "@apollo/client";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import { dialogueMatchmakingEnabled } from "../../lib/publicSettings";

interface MatchmakingProps {
  getMatchedUsers?: boolean;
  getRecommendedUsers?: boolean;
  getOptedInUsers?: boolean;
  getUserDialogueChecks?: { limit: number };
}

interface MatchmakingPropsToResultFields {
  getMatchedUsers: 'matchedUsersQueryResult';
  getRecommendedUsers: 'recommendedUsersQueryResult';
  getOptedInUsers: 'usersOptedInResult';
  getUserDialogueChecks: 'userDialogueChecksResult';
}

type IncludedProps<T extends MatchmakingProps> = {
  [k in keyof T]: T[k] extends false | undefined ? never : k;
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

export const useDialogueMatchmaking = <T extends MatchmakingProps>(currentUser: UsersCurrent | null, props: T): UseDialogueMatchmakingResults<T> => {
  const { getMatchedUsers, getRecommendedUsers, getOptedInUsers, getUserDialogueChecks } = props; 
  const skipByDefault = !dialogueMatchmakingEnabled.get();

  const matchedUsersQueryResult = useQuery(gql`
    query GetDialogueMatchedUsers {
      GetDialogueMatchedUsers {
        _id
        displayName
      }
    }
  `, { skip: skipByDefault || !getMatchedUsers });

  const recommendedUsersQueryResult = useQuery(gql`
    query GetDialogueRecommendedUsers {
      GetDialogueRecommendedUsers {
        _id
        displayName
      }
    }
  `, { skip: skipByDefault || !getRecommendedUsers || !dialogueMatchmakingEnabled.get() });

  const userDialogueChecksResult = useMulti({
    terms: {
      view: "userDialogueChecks",
      // In practice, `skipByDefault` ensures we have a `currentUser`
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      userId: (currentUser?._id)!,
      limit: getUserDialogueChecks?.limit ?? 1000,
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
