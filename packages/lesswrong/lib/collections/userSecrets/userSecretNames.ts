/**
 * Well-known `UserSecrets.name` values. These are an API contract between the
 * client (which lets a user set them), the resolvers (which store them), and
 * sandbox provisioning (which reads them), so they live in one shared place.
 */

/** A user-global secret: the Claude Code OAuth token used for every sandbox. */
export const CLAUDE_CODE_OAUTH_TOKEN_SECRET = "CLAUDE_CODE_OAUTH_TOKEN";

/** A repo's GitHub token — repo-scoped, used to clone/pull a private repo. */
export const GITHUB_TOKEN_SECRET = "GITHUB_TOKEN";
