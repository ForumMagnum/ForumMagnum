import { useCurrentUser } from "../../common/withUser";
import { gql, useQuery } from "@apollo/client";

export const useNotificationDisplays = (limit: number, type?: string) => {
  // We have to do this manually outside of `usePaginatedResolver` because the
  // return type is pure unadulterated JSON, not a registered fragment type

  const currentUser = useCurrentUser();
  return useQuery(gql`
    query getNotificationDisplays($limit: Int, $type: String) {
      NotificationDisplays(limit: $limit, type: $type) {
        results
      }
    }
  `, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    skip: !currentUser,
    pollInterval: 0,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    variables: {
      type,
      limit,
    },
  });
}
