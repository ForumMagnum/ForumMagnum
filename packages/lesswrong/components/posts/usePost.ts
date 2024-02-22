import { useMulti } from '../../lib/crud/withMulti';
import { ApolloError } from '@apollo/client';
import { useSingle, UseSingleProps } from '../../lib/crud/withSingle';

export const usePostBySlug = ({slug}: {slug: string}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "slugPost",
      slug: slug,
    },
    
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
  });
  
  if (results && results.length>0 && results[0]._id) {
    return {
      post: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      post: null,
      loading,
      error: error||null,
    }
  }
}

export const usePostByLegacyId = ({ legacyId }: {legacyId: string}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdPost",
      legacyId: legacyId,
    },
    
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
  });
  
  if (results && results.length>0 && results[0]._id) {
    return {
      post: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      post: null,
      loading,
      error: error||null,
    }
  }
}

type AdditionalDisplayedPostProps = Omit<
  UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision">,
  'collectionName' | 'fragmentName' | 'extraVariables' | 'extraVariableValues' | 'documentId' | 'slug'
>;

/**
 * An optimized wrapper around a `useSingle` to make the main post body load more quickly.
 * Works by including a batchKey to ensure the post query is sent separately from other queries during client-side navigation (not SSR)
 */
export const useDisplayedPost = (postId: string, sequenceId: string | null, version?: string, additionalProps?: AdditionalDisplayedPostProps) => {
  const extraVariables = {sequenceId: 'String', ...(version && {version: 'String'}) }
  const extraVariablesValues = {sequenceId, batchKey: "singlePost", ...(version && {version}) }
  const fragmentName = version ? 'PostsWithNavigationAndRevision' : 'PostsWithNavigation'

  const fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision"> = {
    collectionName: "Posts",
    fragmentName,
    extraVariables,
    extraVariablesValues,
    documentId: postId,
    ...additionalProps
  };

  const result = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">(fetchProps);

  return { ...result, fetchProps };
};
