/* eslint-disable no-console */
import { loadInstanceEnv, getForumTypeEnv } from "./runWithVercelEnv";

loadInstanceEnv().then(({ environment, forumType }) => {
  // Output shell commands to stdout that can be evaluated
  const forumTypeEnv = getForumTypeEnv(forumType);
  
  // Output the export command for the shell to evaluate
  console.log(`export FORUM_TYPE=${forumTypeEnv}`);
  
  // Log info to stderr so it doesn't interfere with the eval
  console.error(`Starting ${environment} ${forumType} instance`);
}).catch(error => {
  console.error('Error running dev instance:', error);
  process.exit(1);
});
