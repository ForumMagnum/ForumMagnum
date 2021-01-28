import { addGraphQLResolvers, addGraphQLSchema, addGraphQLQuery } from './vulcan-lib';
import { getUnrecognizedIndexes, getMissingIndexes } from './indexUtil';
import process from 'process';
import os from 'os';
import { execSync } from 'child_process';
import { getCacheHitRate } from './vulcan-lib/apollo-ssr/pageCache';

// Send this as stringified-JSON rather than as real JSON, because for Mongo
// indexes the order of keys matters, and that ordering doesn't survive
// traversal through GraphQL.
const siteAdminMetadataResolvers = {
  Query: {
    async AdminMetadata(root: void, args: void, context: ResolverContext) {
      if (!context.currentUser || !context.currentUser.isAdmin)
        throw new Error("AdminMetadata graphQL API requires being logged in as an admin");
      
      let missingIndexes = await getMissingIndexes();
      let extraIndexes = await getUnrecognizedIndexes();
      return JSON.stringify({
        missingIndexes: missingIndexes,
        extraIndexes: extraIndexes,
        serverInfo: {
          nodeVersion: process.versions.node,
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
  }
};
addGraphQLResolvers(siteAdminMetadataResolvers);
addGraphQLQuery("AdminMetadata: String");

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
