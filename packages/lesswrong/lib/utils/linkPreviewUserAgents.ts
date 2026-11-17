export function isSlackLinkExpander(userAgent: string | null): boolean {
  return !!userAgent?.startsWith("Slackbot-LinkExpanding");
}
