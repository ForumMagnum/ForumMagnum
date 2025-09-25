/* eslint-disable no-console */
import { loadInstanceEnv } from "./runWithVercelEnv";
import type { ForumType } from "./scriptUtil";

function getForumTypeEnv(forumType: Exclude<ForumType, "none">) {
  switch (forumType) {
    case 'lw':
      return 'FORUM_TYPE=LessWrong';
    case 'af':
      return 'FORUM_TYPE=AlignmentForum';
    case 'ea':
      return 'FORUM_TYPE=EAForum';
  }
}

loadInstanceEnv().then(({ environment, forumType }) => {
  // Output shell commands to stdout that can be evaluated
  const forumTypeEnv = getForumTypeEnv(forumType);
  
  // Output the export command for the shell to evaluate
  console.log(`export ${forumTypeEnv}`);
  
  // Log info to stderr so it doesn't interfere with the eval
  console.error(`Starting ${environment} ${forumType} instance`);
}).catch(error => {
  console.error('Error running dev instance:', error);
  process.exit(1);
});
