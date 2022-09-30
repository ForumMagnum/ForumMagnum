import { createContext, useContext } from "react";
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

export const ForeignApolloClientContext = createContext<ApolloClient<NormalizedCacheObject> | undefined>(undefined);

export const useForeignApolloClient = () => useContext(ForeignApolloClientContext);
