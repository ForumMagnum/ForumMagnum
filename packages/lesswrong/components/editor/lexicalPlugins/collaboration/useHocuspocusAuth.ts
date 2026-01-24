import { useMemo } from "react";
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

  // Memoize the auth object to prevent unnecessary re-renders downstream.
  // Without this, every render would create a new auth object reference,
  // causing useMemo dependencies in parent components to recalculate.
  const auth = useMemo(() => {
    if (loading || error) return null;
    const authData = data?.HocuspocusAuth;
    if (!authData) return null;
    return {
      token: authData.token,
      wsUrl: authData.wsUrl,
      documentName: authData.documentName,
    };
  }, [loading, error, data?.HocuspocusAuth]);

  return { auth, loading, error: error ?? null };
}

