import { useQuery, gql, NetworkStatus, ApolloError } from "@apollo/client";
import { compileTerms, schemaToGraphql } from "../types/schemaToGraphql";
import type { ZodObject, ZodRawShape, z } from "zod";

const getMultiResolverName = <T extends ZodRawShape>(schema: ZodObject<T>) =>
  schema.description + "s" ?? "";

const compileQuery = <T extends ZodRawShape>(
  terms: Record<string, unknown>,
  schema: ZodObject<T>,
) => {
  const compiledTerms = compileTerms(terms);
  const compiledSchema = schemaToGraphql(schema);
  return gql`
    {
      ${getMultiResolverName(schema)}(input: {
        terms: {
          ${compiledTerms}
        }
      }) {
        results {
          ${compiledSchema}
        }
      }
    }
  `;
}

type UseMultiProps<T extends ZodRawShape> = {
  terms: Record<string, unknown>,
  schema: ZodObject<T>,
}

type UseMultiResult<T extends ZodRawShape> = {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  results?: z.infer<ZodObject<T>>[],
  refetch: () => void,
  error?: ApolloError,
}

export const useMulti = <T extends ZodRawShape>({
  terms,
  schema,
}: UseMultiProps<T>): UseMultiResult<T> => {
  const query = compileQuery(terms, schema);
  const {
    data,
    error,
    loading,
    refetch,
    networkStatus,
  } = useQuery(query, {
  });
  const results = data?.[getMultiResolverName(schema)]?.results;
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results,
    refetch,
    error,
  };
}
