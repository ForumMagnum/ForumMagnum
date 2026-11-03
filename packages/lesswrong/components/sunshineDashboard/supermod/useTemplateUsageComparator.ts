import { useCallback, useMemo } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const ModerationTemplateUsageCountsQuery = gql(`
  query moderationTemplateUsageCountsuseTemplateUsageComparatorQuery {
    moderationTemplateUsageCounts {
      templateId
      count
    }
  }
`);

/**
 * Orders moderation templates by how often moderators have used them recently,
 * most used first, so the number shortcuts land on the common ones.
 */
export function useTemplateUsageComparator() {
  const { data } = useQuery(ModerationTemplateUsageCountsQuery, { ssr: false });
  const usageCounts = useMemo(
    () => new Map((data?.moderationTemplateUsageCounts ?? []).map(({ templateId, count }) => [templateId, count])),
    [data],
  );
  return useCallback(
    (a: ModerationTemplateFragment, b: ModerationTemplateFragment) => (usageCounts.get(b._id) ?? 0) - (usageCounts.get(a._id) ?? 0),
    [usageCounts],
  );
}
