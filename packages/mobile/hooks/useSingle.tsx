import { useQuery, gql, NetworkStatus, ApolloError } from "@apollo/client";
import { compileTerms, schemaToGraphql } from "../types/schemaToGraphql";
import type { ZodObject, ZodRawShape, z } from "zod";

const getSingleResolverName = <T extends ZodRawShape>(schema: ZodObject<T>) =>
  schema.description ?? "";

const compileQuery = <T extends ZodRawShape>(
  selector: Record<string, unknown>,
  schema: ZodObject<T>,
) => {
  const compiledSelector = compileTerms(selector);
  const compiledSchema = schemaToGraphql(schema);
  return gql`
    {
      ${getSingleResolverName(schema)}(input: {
        selector: {
          ${compiledSelector}
        }
      }) {
        result {
          ${compiledSchema}
        }
      }
    }
  `;
}

type UseSingleProps<T extends ZodRawShape> = {
  selector: Record<string, unknown>,
  schema: ZodObject<T>,
}

type UseSingleResult<T extends ZodRawShape> = {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  result?: z.infer<ZodObject<T>>,
  refetch: () => void,
  error?: ApolloError,
}

export const useSingle = <T extends ZodRawShape>({
  selector,
  schema,
}: UseSingleProps<T>): UseSingleResult<T> => {
  const query = compileQuery(selector, schema);
  const {
    data,
    error,
    loading,
    refetch,
    networkStatus,
  } = useQuery(query, {
  });
  const result = data?.[getSingleResolverName(schema)]?.result;
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    result,
    refetch,
    error,
  };
}
