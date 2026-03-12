import { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
// import { getIsolationScope } from '@sentry/nextjs';
import path from 'path'
import { expressSessionSecretSetting, botProtectionCommentRedirectSetting } from './databaseSettings';
// import { addForumSpecificMiddleware } from './forumSpecificMiddleware';
import { closePerfMetric, openPerfMetric } from './perfMetrics';
import { getCommandLineArguments } from './commandLine';
import { isEAForum, isElasticEnabled, performanceMetricLoggingEnabled, testServerSetting } from "../lib/instanceSettings";
