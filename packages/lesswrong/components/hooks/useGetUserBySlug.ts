import { fragmentTextForQuery } from "@/lib/vulcan-lib/fragments";
import { gql, useQuery } from "@apollo/client";

interface GetUserBySlugOptions<FragmentName extends FragmentTypesByCollection['Users']> {
  fragmentName: FragmentName;
  skip?: boolean;

}

export function useGetUserBySlug<FragmentName extends FragmentTypesByCollection['Users']>(slug: string | undefined, options: GetUserBySlugOptions<FragmentName>) {
  const { fragmentName, skip } = options;

  const { data, ...rest } = useQuery<{ GetUserBySlug: FragmentTypes[FragmentName] }>(gql`
    query GetUserBySlug($slug: String!) {
      GetUserBySlug(slug: $slug) {
        ...${fragmentName}
      }
    }
    ${fragmentTextForQuery(fragmentName)}
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
