import { isE2E } from "../../../lib/executionEnvironment";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";
import keyBy from "lodash/keyBy";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const UserOnboardingAuthorMultiQuery = gql(`
  query multiUseruseSuggestedSubscriptionsQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserOnboardingAuthor
      }
      totalCount
    }
  }
`);

const UserOnboardingTagMultiQuery = gql(`
  query multiTaguseSuggestedSubscriptionsQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserOnboardingTag
      }
      totalCount
    }
  }
`);

const subscribeTagIds: string[] = [
  "sWcuTyTB5dP3nas2t", // Global health and development
  "QdH9f8TC6G8oGYdgt", // Animal welfare
  "ee66CtAMYurQreWBH", // Existential risk
  "H43gvLzBCacxxamPe", // Biosecurity and pandemics
  "oNiQsBHA3i837sySD", // AI safety
  "4eyeLKC64Yvznzt6Z", // Philosophy
  "EHLmbEmJ2Qd5WfwTb", // Building effective altruism
  "aJnrnnobcBNWRsfAw", // Forecasting and estimation
  "psBzwdY8ipfCeExJ7", // Cause prioritisation
  "4CH9vsvzyk4mSKwyZ", // Career choice
];

const subscribeUserIds: string[] = [
  "9Fg4woeMPHoGa6kDA", // Holden Karnofsky
  "kBZnCSYFXGowSD8mD", // Katja Grace
  "b4mnJTtwXMkqkv3Yq", // Laura Duffy
  "DkFp3vmyWxPmDqNcp", // Richard Y Chappell
  "H3tBLXCQEMqkyJiMJ", // Kelsey Piper
  "LMgZyi4w3XoYz3tM5", // sauilius
  "R4mvcEPhmLiBahN4H", // Toby Ord
  "JBx8HXhshWMMKpafM", // Jacob_Peacock
  "Ng9dxDSsc5uK4Zsmx", // CarlShulman
  "J8rxnfpHSTCbDNC2j", // Joe_Carlsmith
];

export const useSuggestedSubscriptions = () => {
  const { data } = useQuery(UserOnboardingTagMultiQuery, {
    variables: {
      selector: { tagsByTagIds: { tagIds: subscribeTagIds } },
      limit: subscribeTagIds.length,
      enableTotal: false,
    },
    skip: isE2E,
    notifyOnNetworkStatusChange: true,
  });

  const rawTags = data?.tags?.results;
  const tagsById = keyBy(rawTags, "_id");
  const tags = filterNonnull(subscribeTagIds.map((_id) => tagsById[_id]));

  const { data: dataUserOnboardingAuthor } = useQuery(UserOnboardingAuthorMultiQuery, {
    variables: {
      selector: { usersByUserIds: { userIds: subscribeUserIds } },
      limit: subscribeUserIds.length,
      enableTotal: false,
    },
    skip: isE2E,
    notifyOnNetworkStatusChange: true,
  });

  const rawUsers = dataUserOnboardingAuthor?.users?.results;
  const usersById = keyBy(rawUsers, "_id");
  const users = filterNonnull(subscribeUserIds.map((_id) => usersById[_id]));

  return {
    tags,
    users,
  };
}
