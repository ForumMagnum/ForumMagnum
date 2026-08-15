import { useMemo } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { parseHighlightRuleOverrides, type HighlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRuleTypes";

export const SupermodHighlightRuleOverridesQuery = gql(`
  query SupermodHighlightRuleOverrides {
    supermodHighlightRuleOverrides
  }
`);

/**
 * The moderator-edited highlight rules, which shadow the defaults in the code. Apollo dedupes
 * this across the several inbox components that evaluate highlights, so it's one request.
 */
export function useHighlightRuleOverrides(): { overrides: HighlightRuleOverrides | null, loading: boolean } {
  const { data, loading } = useQuery(SupermodHighlightRuleOverridesQuery, { ssr: false });
  const overrides = useMemo(() => {
    const value = data?.supermodHighlightRuleOverrides;
    if (!value) return null;
    try {
      return parseHighlightRuleOverrides(value);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Stored supermod highlight rule overrides are malformed; using the defaults", e);
      return null;
    }
  }, [data]);
  return { overrides, loading };
}
