import { createContext, useContext } from "react";
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

const ForeignApolloClientContext = createContext<ApolloClient | undefined>(undefined);

export const ForeignApolloClientProvider = ForeignApolloClientContext.Provider;

export const useForeignApolloClient = () => useContext(ForeignApolloClientContext);
