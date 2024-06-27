import { useCurrentUser } from "../../common/withUser";
import { gql } from "@apollo/client";
import { useQueryWrapped } from "@/lib/crud/useQuery";

// We have to do this manually outside of `usePaginatedResolver` because the
// return type is pure unadulterated JSON, not a registered fragment type
const query = gql`
  query getNotificationDisplays($limit: Int, $type: String) {
    NotificationDisplays(limit: $limit, type: $type) {
      results
    }
  }
`;

export const useNotificationDisplays = (limit: number, type?: string) => {
  const currentUser = useCurrentUser();
  return useQueryWrapped(query, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    skip: !currentUser,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    variables: {
      type,
      limit,
    },
  });
}
