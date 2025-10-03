import React from 'react';
import { HelmetServerState } from 'react-helmet-async';

const Head = ({userAgent, helmetContext}: {
  userAgent?: string
  helmetContext: {helmet?: HelmetServerState}
}) => {
  // Helmet.rewind() is deprecated in favour of renderStatic() for better readability
  //@see https://github.com/nfl/react-helmet/releases/tag/5.0.0
  const helmet = helmetContext.helmet;
  
  // For any html element type you want to appear in <head>, you have to add it explicitly here
  return (
    <>
      {helmet?.title.toComponent() as unknown as React.ReactNode}
      {helmet?.meta.toComponent() as unknown as React.ReactNode}
      {helmet?.link.toComponent() as unknown as React.ReactNode}
      {helmet?.script.toComponent() as unknown as React.ReactNode}
      
      {/* Twitter link-card
       * Note 2023-10-05: Twitter's "summary_large_image" card currently shows only
       * an image with no title/description/etc, so we only ever use "summary". Before
       * Twitter made this change, we switched between "summary" and "summary_large_image"
       * based on the `useSmallImage` prop. Twitter is getting backlash about this, so
       * they might revert (in which case we might also revert).
       * See: https://news.ycombinator.com/item?id=37782945
       *
       * Note 2023-10-20: If the user-agent is Slackbot and there is a
       * twitter:card meta tag, change the twitter:card meta tag from "summary"
       * to "summary_large_image". This is necessary because Slack uses
       * Twitter's header to decide on its link-preview style, the Twitter
       * version of the summary_large_image style is bad (doesn't show
       * title/description), and the Slack version of the *default* link-preview
       * style is bad. So we need to make this header different depending which
       * bot is loading the page.
       *
       * Note 2098-10-25: We were saved from the AI apocalypse when the AI tried
       * to clean up all of the software technical debt. Worried that it might
       * finish soon.
       */}
      {(userAgent && userAgent.startsWith("Slackbot-LinkExpanding"))
        ? <meta name="twitter:card" content="summary_large_image"/>
        : <meta name="twitter:card" content="summary"/>}
    </>
  );
};
export default Head;
