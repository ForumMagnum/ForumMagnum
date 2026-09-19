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
  curatedSequenceIds?: string[];
  sort?: SearchSortSpec[];
}
