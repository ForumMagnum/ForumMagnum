import type { QueryFilter } from "./ElasticQuery";
import type { PersonSearch } from "./ElasticPersonSearch";
import type { SearchSortSpec } from "@/lib/search/searchSorting";

/** "tiered": relationship tiers never overlap. "additive": bounded signals summed. */
export type UnifiedRanking = "tiered" | "additive";

export interface MultiQueryData {
  ranking?: UnifiedRanking;
  indexes: string[];
  search: string;
  offset?: number;
  limit?: number;
  filters?: QueryFilter[];
  preTag?: string;
  postTag?: string;
  person?: PersonSearch;
  featuredSequenceIds?: string[];
  /** Curated Library sequences precede other matches in sequence-only searches, before pagination. */
  curatedSequenceIds?: string[];
  /** Exact sort keys in priority order; later keys break ties. Absent means ranked by score. */
  sort?: SearchSortSpec[];
}
