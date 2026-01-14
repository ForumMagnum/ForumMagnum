import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { useSubscribedLocation } from "@/lib/routeUtil";

const HocuspocusAuthQuery = gql(`
  query HocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
      wsUrl
      documentName
    }
  }
`);

export interface HocuspocusAuthResult {
  token: string;
  wsUrl: string;
  documentName: string;
}

/**
 * Hook to fetch Hocuspocus authentication credentials for collaborative editing.
 * 
 * @param postId - The ID of the post to collaborate on
 * @param skip - Whether to skip fetching (useful when collaboration is disabled)
 */
export function useHocuspocusAuth(postId: string | null, skip = false): {
  auth: HocuspocusAuthResult | null;
  loading: boolean;
  error: Error | null;
} {
  // Get the sharing key from URL params
  const { query } = useSubscribedLocation();
  const linkSharingKey = typeof query.key === 'string' ? query.key : null;
  
  const { data, loading, error } = useQuery(HocuspocusAuthQuery, {
    variables: { postId: postId!, linkSharingKey },
    skip: skip || !postId,
    ssr: false, // Don't fetch during SSR - collaboration is client-only
  });

  if (loading) {
    return { auth: null, loading: true, error: null };
  }

  if (error) {
    return { auth: null, loading: false, error };
  }

  const auth = data?.HocuspocusAuth;
  if (!auth) {
    return { auth: null, loading: false, error: null };
  }

  return {
    auth: {
      token: auth.token,
      wsUrl: auth.wsUrl,
      documentName: auth.documentName,
    },
    loading: false,
    error: null,
  };
}

