import process from 'process';
import os from 'os';
import { execSync } from 'child_process';
import { getCacheHitRate } from './vulcan-lib/apollo-ssr/pageCache';
import { getPreloadedDatabaseId } from './loadDatabaseSettings';
import gql from 'graphql-tag';
// Send this as stringified-JSON rather than as real JSON, because for Mongo
// indexes the order of keys matters, and that ordering doesn't survive
// traversal through GraphQL.

export const siteAdminMetadataGraphQLTypeDefs = gql`
  extend type Query {
    AdminMetadata: String
  }
`

export const siteAdminMetadataGraphQLQueries = {
  async AdminMetadata(root: void, args: void, context: ResolverContext) {
    if (!context.currentUser || !context.currentUser.isAdmin)
      throw new Error("AdminMetadata graphQL API requires being logged in as an admin");
    
    return JSON.stringify({
      serverInfo: {
        nodeVersion: process.versions.node,
        databaseId: getPreloadedDatabaseId().databaseId,
        gitCommit: getGitCommit(),
        gitBranch: getGitBranch(),
        cpuCores: os.cpus()?.length,
        cpuModel: os.cpus()?.[0]?.model,
        memoryTotal: os.totalmem(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        pageCacheHitRate: getCacheHitRate(),
        serverTimezoneOffset: new Date().getTimezoneOffset()/60.0,
      },
    });
  }
};

function getGitCommit(): string {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch(e) {
    return "Unknown";
  }
}

function getGitBranch(): string {
  try {
    return execSync("git branch --show-current").toString().trim();
  } catch(e) {
    return "Unknown";
  }
}
