import React from 'react';
// import { ApolloProvider } from '@apollo/client/react';
// import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
// import type { Request } from 'express';
// // eslint-disable-next-line no-restricted-imports
// import { StaticRouter } from 'react-router';
// import { ForeignApolloClientProvider } from '../../../../components/hooks/useForeignApolloClient';
// import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
// import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../../../../lib/abTestImpl';
// import { ServerRequestStatusContextType } from '../../../../lib/vulcan-core/appContext';
// import { getAllCookiesFromReq } from '../../../utils/httpUtil';
// import { SSRMetadata, EnvironmentOverrideContext } from '../../../../lib/utils/timeUtil';
// import { LayoutOptionsContextProvider } from '../../../../components/hooks/useLayoutOptions';
// import { EnableSuspenseContext } from '@/lib/crud/useQuery';
// import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
// import { AbstractThemeOptions } from '@/themes/themeNames';
// import AppComponent from '../../../../components/vulcan-core/App';
// import { HelmetProvider, HelmetServerState } from 'react-helmet-async';
// import { SSRResponseContext } from '@/components/common/Helmet';
// import type { ResponseManager } from '@/server/rendering/ResponseManager';

// Server-side wrapper around the app. There's another AppGenerator which is
// the client-side version, which differs in how it sets up the wrappers for
// routing and cookies and such. See client/start.tsx.
const AppGenerator = ({
  // req, onHeadBlockSent, responseManager, apolloClient, foreignApolloClient, serverRequestStatus, abTestGroupsUsed, ssrMetadata, themeOptions, enableSuspense, helmetContext
}: {
  // req: Request,
  // onHeadBlockSent: (name: string) => void,
  // responseManager: ResponseManager,
  // apolloClient: ApolloClient,
  // foreignApolloClient: ApolloClient,
  // serverRequestStatus: ServerRequestStatusContextType,
  // abTestGroupsUsed: RelevantTestGroupAllocation,
  // ssrMetadata: SSRMetadata,
  // themeOptions: AbstractThemeOptions,
  // enableSuspense: boolean,
  // helmetContext: {helmet?: HelmetServerState},
}) => {
  // const App = (
  //   <HelmetProvider context={helmetContext}>
  //   <SSRResponseContext.Provider value={{
  //     onSendHeadBlock: onHeadBlockSent,
  //     setStructuredData: (generate) => {
  //       responseManager.setStructuredData(generate);
  //     }
  //   }}>
  //   <EnableSuspenseContext.Provider value={enableSuspense}>
  //   <ApolloProvider client={apolloClient}>
  //     <ForeignApolloClientProvider value={foreignApolloClient}>
  //       {/* We do not use the context for StaticRouter here, and instead are using our own context provider */}
  //       <StaticRouter location={req.url}>
  //         <CookiesProvider cookies={getAllCookiesFromReq(req)}>
  //           <ThemeContextProvider options={themeOptions}>
  //           <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
  //             <LayoutOptionsContextProvider>
  //               <EnvironmentOverrideContext.Provider value={{
  //                 ...ssrMetadata,
  //                 matchSSR: true
  //               }}>
  //                 <AppComponent
  //                   apolloClient={apolloClient}
  //                   serverRequestStatus={serverRequestStatus}
  //                 />
  //               </EnvironmentOverrideContext.Provider>
  //             </LayoutOptionsContextProvider>
  //           </ABTestGroupsUsedContext.Provider>
  //           </ThemeContextProvider>
  //         </CookiesProvider>
  //       </StaticRouter>
  //     </ForeignApolloClientProvider>
  //   </ApolloProvider>
  //   </EnableSuspenseContext.Provider>
  //   </SSRResponseContext.Provider>
  //   </HelmetProvider>
  // );
  // return App;
  return <></>;
};
export default AppGenerator;
