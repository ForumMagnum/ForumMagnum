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
