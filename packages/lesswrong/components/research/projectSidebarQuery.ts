import type { ApolloClient } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { sleep } from '@/lib/utils/asyncUtils';

export const ProjectSidebarQuery = gql(`
  query ProjectSidebarQuery($projectId: String!) {
    researchProject(selector: { _id: $projectId }) {
      result {
        _id
        title
      }
    }
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        title
        icon
        sortOrder
        createdAt
      }
    }
    researchConversations(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        title
        icon
        lastActivityAt
        entrypointKind
        entrypointDocumentId
      }
    }
  }
`);

// Title generation is a server-side backgroundTask, so the mutation's own
// refetch usually lands while `title` is still null.
const TITLE_POLL_DELAYS_MS = [1500, 2500, 4000, 6000];

function readConversationTitleFromCache(
  client: ApolloClient,
  projectId: string,
  conversationId: string,
): string | null | undefined {
  const data = client.readQuery({
    query: ProjectSidebarQuery,
    variables: { projectId },
  });
  return data?.researchConversations?.results
    ?.find(c => c._id === conversationId)?.title;
}

export async function pollForConversationTitle(
  client: ApolloClient,
  projectId: string,
  conversationId: string,
) {
  for (const delay of TITLE_POLL_DELAYS_MS) {
    await sleep(delay);
    if (readConversationTitleFromCache(client, projectId, conversationId)) return;
    await client.refetchQueries({ include: [ProjectSidebarQuery] });
    if (readConversationTitleFromCache(client, projectId, conversationId)) return;
  }
}
