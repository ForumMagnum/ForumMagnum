import { ApolloServer, ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
// import { handleRequest } from './rendering/renderPage';
import cors from 'cors';
import { isDevelopment } from '../lib/executionEnvironment';
// import { pickerMiddleware, addStaticRoute } from './vulcan-lib/staticRoutes';
import { graphiqlMiddleware } from './vulcan-lib/apollo-server/graphiql'; 
import { configureSentryScope, getContextFromReqAndRes } from './vulcan-lib/apollo-server/context';
import { getUserFromReq } from './vulcan-lib/apollo-server/getUserFromReq';
import universalCookiesMiddleware from 'universal-cookie-express';
import { formatError } from 'apollo-errors';
// import { getIsolationScope } from '@sentry/nextjs';
import path from 'path'
import { expressSessionSecretSetting, botProtectionCommentRedirectSetting } from './databaseSettings';
// import { addForumSpecificMiddleware } from './forumSpecificMiddleware';
import { logGraphqlQueryStarted, logGraphqlQueryFinished } from './logging';
import expressSession from 'express-session';
import MongoStore from './vendor/ConnectMongo/MongoStore';
import { ckEditorTokenHandler } from './ckEditor/ckEditorToken';
import { addTestingRoutes } from './testingSqlClient';
import { addCrosspostRoutes } from './fmCrosspost/routes';
import { getUserEmail } from "../lib/collections/users/helpers";
import { inspect } from "util";
import { Sessions } from '../server/collections/sessions/collection';
import { hstsMiddleware } from './hsts';
import { getClientBundle } from './utils/bundleUtils';
import ElasticController from './search/elastic/ElasticController';
import { closePerfMetric, openPerfMetric } from './perfMetrics';
// import { addAdminRoutesMiddleware } from './adminRoutesMiddleware'
import { getSqlClientOrThrow } from './sql/sqlClient';
import { getCommandLineArguments } from './commandLine';
import { isEAForum, isElasticEnabled, performanceMetricLoggingEnabled, testServerSetting } from "../lib/instanceSettings";
import { getExecutableSchema } from './vulcan-lib/apollo-server/initGraphQL';
import express from 'express';
export const app = express();
import { getSiteUrl } from '@/lib/vulcan-lib/utils';
import { requestToNextRequest } from './utils/requestToNextRequest';
import { defaultNotificationsView, NotificationsViews } from '@/lib/collections/notifications/views';
import Notifications from './collections/notifications/collection';
import { isFriendlyUI } from '@/themes/forumTheme';


class ApolloServerLogging implements ApolloServerPlugin<ResolverContext> {
  async requestDidStart({ request, contextValue: context }: GraphQLRequestContext<ResolverContext>) {
    const { operationName = 'unknownGqlOperation', query, variables } = request;

    //remove sensitive data from variables such as password
    let filteredVariables = variables;
    if (variables) {
      filteredVariables =  Object.keys(variables).reduce((acc, key) => {
        return (key === 'password') ?  acc : { ...acc, [key]: variables[key] };
      }, {});
    }

    let startedRequestMetric: IncompletePerfMetric;
    if (performanceMetricLoggingEnabled.get()) {
      startedRequestMetric = openPerfMetric({
        op_type: 'query',
        op_name: operationName,
        parent_trace_id: context.perfMetric?.trace_id,
        extra_data: filteredVariables,
        gql_string: query
      });  
    }

    if (query) {
      logGraphqlQueryStarted(operationName, query, variables);
    }
    
    return {
      async willSendResponse() { // hook for transaction finished
        if (performanceMetricLoggingEnabled.get()) {
          closePerfMetric(startedRequestMetric);
        }

        if (query) {
          logGraphqlQueryFinished(operationName, query);
        }
      }
    };
  }
}
