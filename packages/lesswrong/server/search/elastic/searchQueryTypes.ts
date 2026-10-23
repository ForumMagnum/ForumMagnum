import type { QueryFilter } from "./ElasticQuery";
import type { PersonSearch } from "./ElasticPersonSearch";

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
}
