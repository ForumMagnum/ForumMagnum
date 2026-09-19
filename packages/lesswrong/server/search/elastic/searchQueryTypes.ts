import type { QueryFilter } from "./ElasticQuery";
import type { PersonSearch } from "./ElasticPersonSearch";
import type { SearchSortSpec } from "@/lib/search/searchSorting";

export interface SearchQueryData {
  indexes: string[];
  search: string;
  offset?: number;
  limit?: number;
  filters?: QueryFilter[];
  preTag?: string;
  postTag?: string;
  person?: PersonSearch;
  /** Curated Library sequences precede other matches in sequence-only searches, before pagination. */
  curatedSequenceIds?: string[];
  /** Exact sort keys in priority order; later keys break ties. Absent means ranked by score. */
  sort?: SearchSortSpec[];
}
