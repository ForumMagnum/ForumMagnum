import { gql as dynamicGql, useQuery } from "@apollo/client";
import { UsersMinimumInfo, UsersEdit, UsersProfileEdit } from "@/lib/collections/users/fragments";

type UserFragments = 'UsersMinimumInfo' | 'UsersEdit' | 'UsersProfileEdit';

interface GetUserBySlugOptions<FragmentName extends UserFragments> {
  fragmentName: FragmentName;
  skip?: boolean;
}

function useUserFragment<FragmentName extends UserFragments>(fragmentName: FragmentName) {
  switch (fragmentName) {
    case 'UsersMinimumInfo':
      return UsersMinimumInfo;
    case 'UsersEdit':
      return UsersEdit;
    case 'UsersProfileEdit':
      return UsersProfileEdit;
  }
}

export function useGetUserBySlug<FragmentName extends UserFragments>(slug: string | undefined, options: GetUserBySlugOptions<FragmentName>) {
  const { fragmentName, skip } = options;
  const fragment = useUserFragment(fragmentName);

  // const queryText = 
  const { data, ...rest } = useQuery<{ GetUserBySlug: FragmentTypes[FragmentName] }>(dynamicGql`
    query GetUserBySlug($slug: String!) {
      GetUserBySlug(slug: $slug) {
        ...${fragmentName}
      }
      ${fragment}
    }
  `, {
    fetchPolicy: 'network-only',
    variables: { slug },
    skip: skip || !slug,
  });

  return {
    user: data?.GetUserBySlug,
    ...rest,
  };
}
