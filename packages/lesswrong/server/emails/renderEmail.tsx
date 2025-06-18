import { htmlToText } from 'html-to-text';
import Juice from 'juice';
import { sendEmailSmtp } from './sendEmail';
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';
import { renderToString } from 'react-dom/server';
import { TimezoneContext } from '../../components/common/withTimezone';
import { UserContext } from '../../components/common/withUser';
import { getUserEmail, userEmailAddressIsVerified} from '../../lib/collections/users/helpers';
import { forumTitleSetting, isLWorAF } from '../../lib/instanceSettings';
import { getForumTheme } from '../../themes/forumTheme';
import { DatabaseServerSetting } from '../databaseSettings';
import { EmailRenderContext } from '../../lib/vulcan-lib/components';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { emailTokenTypesByName } from '../emails/emailTokens';
import { captureException } from '@sentry/core';
import { isE2E } from '../../lib/executionEnvironment';
import { cheerioParse } from '../utils/htmlUtil';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';
import { createLWEvent } from '../collections/lwevents/mutations';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { FMJssProvider } from '@/components/hooks/FMJssProvider';
import { createStylesContext } from '@/components/hooks/useStyles';
import { generateEmailStylesheet } from '../styleGeneration';
import { ThemeContextProvider } from '@/components/themes/ThemeContextProvider';
import { ThemeOptions } from '@/themes/themeNames';
import { EmailWrapper } from '../emailComponents/EmailWrapper';
import CookiesProvider from '@/lib/vendor/react-cookie/CookiesProvider';
import { utmifyForumBacklinks, UtmParam } from '../analytics/utm-tracking';

export interface RenderedEmail {
  user: DbUser | null,
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string,
}

// How many characters to wrap the plain-text version of the email to
const plainTextWordWrap = 80;

// Doctype string at the header of HTML emails
export const emailDoctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';

// Global email CSS, inherited from Vulcan-Starter. Some of this is about
// handling the top-level table layout; some of it looks like workarounds for
// specific dysfunctional email clients (like the ".ExternalClass" and
// ".yshortcuts" entries.)
const emailGlobalCss = () => `
  .ReadMsgBody { width: 100%; background-color: #ebebeb;}
  .ExternalClass {width: 100%; background-color: #ebebeb;}
  .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height:100%;}
  body {-webkit-text-size-adjust:none; -ms-text-size-adjust:none;}
  body {margin:0; padding:0;}
  table {border-spacing:0;}
  table td {border-collapse:collapse;}
  .yshortcuts a {border-bottom: none !important;}

  /* Constrain email width for small screens */
  @media screen and (max-width: 600px) {
    table[class="container"] {
      width: 95% !important;
    }
    .wrapper{
      font-size: 14px !important;
    }
  }

  /* Give content more room on mobile */
  @media screen and (max-width: 480px) {
    td[class="container-padding"] {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  }
  
  /* Global styles that apply eg inside of posts */
  a {
    color: ${getForumTheme({name: "default"}).palette.primary.main};
  }
  blockquote {
    border-left: solid 3px #e0e0e0;
    padding: .75em 2em;
    margin: 0;
    color: rgba(0,0,0, 0.87);
  }
`;

function addEmailBoilerplate({ css, title, body }: {
  css: string,
  title: string,
  body: string
}): string
{
  return `
    <html lang="en">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8"/>
      <!-- So that mobile webkit will display zoomed in -->
      <meta name="viewport" content="initial-scale=1.0"/>
      <!-- disable auto telephone linking in iOS -->
      <meta name="format-detection" content="telephone=no"/>
   
      <title>${title}</title>
      <style>
        ${emailGlobalCss()}
        ${css}
      </style>
    </head>
    ${body}
    </html>
  `;
}

// Render an email. Arguments:
//
//   user: A user object. The user the email is being sent to, and also the
//     user whose perspective the body is rendered from (ie, withCurrentUser
//     will get this user).
//   subject: String. The email subject line.
//   bodyComponent: A React component, which will be used to render the body.
//   boilerplateGenerate: (optional) A function which takes a style block,
//     title, and HTML body (string), and assembles HTML boilerplate. Override
//     for simpler documents in unit tests.
//
// The same components HoCs that are used for rendering pages, can also be used
// in emails, with some restrictions:
//   * Everything must be server-side rendered.
//   * No click handlers, componentDidMount, or other client-side Javascript.
//   * While any JSS in withStyles will be included in the email, only a very
//     limited and inconsistent subset is supported by mail clients
//

const defaultEmailSetting = new DatabaseServerSetting<string>('defaultEmail', "hello@world.com")

export async function generateEmail({user, to, from, subject, bodyComponent, boilerplateGenerator=addEmailBoilerplate, utmParams}: {
  user: DbUser | null,
  to: string,
  from?: string,
  subject: string,
  bodyComponent: React.ReactNode,
  boilerplateGenerator?: (props: {css: string, title: string, body: string}) => string,
  utmParams?: Partial<Record<UtmParam, string>>;
}): Promise<RenderedEmail>
{
  if (!subject) throw new Error("Missing required argument: subject");
  if (!bodyComponent) throw new Error("Missing required argument: bodyComponent");
  
  // Set up Apollo
  const { createClient }: typeof import('../vulcan-lib/apollo-ssr/apolloClient') = require('../vulcan-lib/apollo-ssr/apolloClient');
  const apolloClient = await createClient(await computeContextFromUser({user, isSSR: false}));
  
  // Use the user's last-used timezone, which is the timezone of their browser
  // the last time they visited the site. Potentially null, if they haven't
  // visited since before that feature was implemented.
  const timezone = user?.lastUsedTimezone || null
  
  const themeOptions: ThemeOptions = {name: "default", siteThemeOverride: {}};
  const theme = getForumTheme(themeOptions);
  const stylesContext = createStylesContext(theme);
  
  // Wrap the body in Apollo, JSS, and MUI wrappers.
  const wrappedBodyComponent = (
    <EmailRenderContext.Provider value={{isEmailRender:true}}>
    <ApolloProvider client={apolloClient}>
    <CookiesProvider>
    <ThemeContextProvider options={themeOptions} isEmail={true}>
    <FMJssProvider stylesContext={stylesContext}>
    <UserContext.Provider value={user as unknown as UsersCurrent | null /*FIXME*/}>
    <TimezoneContext.Provider value={timezone}>
      {bodyComponent}
    </TimezoneContext.Provider>
    </UserContext.Provider>
    </FMJssProvider>
    </ThemeContextProvider>
    </CookiesProvider>
    </ApolloProvider>
    </EmailRenderContext.Provider>
  );
  
  // Traverse the tree, running GraphQL queries and expanding the tree
  // accordingly.
  await getDataFromTree(wrappedBodyComponent);
  
  // Render the REACT tree to an HTML string
  const body = renderToString(wrappedBodyComponent);
  
  // Get JSS styles, which were added to sheetsRegistry as a byproduct of
  // renderToString.
  const css = generateEmailStylesheet({ stylesContext, theme, themeOptions });
  const html = boilerplateGenerator({ css, body, title:subject })
  
  // Find any relative links, and convert them to absolute
  const htmlWithAbsoluteUrls = makeAllUrlsAbsolute(html, getSiteUrl());
  const htmlWithUtmParams = utmifyForumBacklinks({ html: htmlWithAbsoluteUrls, utmParams, siteUrl: getSiteUrl() });
  
  // Since emails can't use <style> tags, only inline styles, use the Juice
  // library to convert accordingly.
  const inlinedHTML = Juice(htmlWithUtmParams, { preserveMediaQueries: true });
  
  // Generate a plain-text representation, based on the React representation
  const plaintext = htmlToText(htmlWithUtmParams, {
    wordwrap: plainTextWordWrap
  });
  
  const fromAddress = from || defaultEmailSetting.get()
  if (!fromAddress) {
    throw new Error("No source email address configured. Make sure \"defaultEmail\" is set in your settings.json.");
  }
  
  const sitename = forumTitleSetting.get();
  if (!sitename) {
    throw new Error("No site name configured. Make sure \"title\" is set in your settings.json.");
  }
  const taggedSubject = `[${sitename}] ${subject}`;
  
  return {
    user,
    to,
    from: fromAddress,
    subject: isLWorAF ? taggedSubject : subject,
    html: emailDoctype + inlinedHTML,
    text: plaintext,
  }
}
export const wrapAndRenderEmail = async ({
  user,
  to,
  from,
  subject,
  body,
  utmParams
}: {
  user: DbUser | null;
  to: string;
  from?: string;
  subject: string;
  body: React.ReactNode;
  utmParams?: Partial<Record<UtmParam, string>>;
}): Promise<RenderedEmail> => {
  const unsubscribeAllLink = user ? await emailTokenTypesByName.unsubscribeAll.generateLink(user._id) : null;
  return await generateEmail({
    user,
    to,
    from,
    subject: subject,
    bodyComponent: <EmailWrapper
      unsubscribeAllLink={unsubscribeAllLink}
    >
      {body}
    </EmailWrapper>,
    utmParams
  });
}

export const wrapAndSendEmail = async ({
  user,
  force = false,
  to,
  from,
  subject,
  body,
  utmParams
}: {
  user: DbUser | null;
  force?: boolean;
  to?: string;
  from?: string;
  subject: string;
  body: React.ReactNode;
  utmParams?: Partial<Record<UtmParam, string>>;
}): Promise<boolean> => {
  if (isE2E) {
    return true;
  }
  if (!to && !user) throw new Error("No destination email address for logged-out user email");
  const destinationAddress = to || getUserEmail(user)
  if (!destinationAddress) throw new Error("No destination email address for user email");

  const _reasonUserCantReceiveEmails = user && reasonUserCantReceiveEmails(user)
  if(!force && user && !!_reasonUserCantReceiveEmails) {
    //eslint-disable-next-line no-console
    console.log(`Skipping user ${user.username} when emailing: ${_reasonUserCantReceiveEmails}`);
    return false
  }

  try {
    const email = await wrapAndRenderEmail({ user, to: destinationAddress, from, subject, body, utmParams });
    const succeeded = await sendEmail(email);
    void logSentEmail(email, user, {succeeded});
    return succeeded;
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
    captureException(e);
    return false;
  }
}

const enableDevelopmentEmailsSetting = new DatabaseServerSetting<boolean>('enableDevelopmentEmails', false)
async function sendEmail(renderedEmail: RenderedEmail): Promise<boolean>
{
  if (process.env.NODE_ENV === 'production' || enableDevelopmentEmailsSetting.get()) {
    console.log("//////// Sending email..."); //eslint-disable-line
    console.log("to: " + renderedEmail.to); //eslint-disable-line
    console.log("subject: " + renderedEmail.subject); //eslint-disable-line
    console.log("from: " + renderedEmail.from); //eslint-disable-line
    
    return sendEmailSmtp(renderedEmail);
  } else {
    console.log("//////// Pretending to send email (not production and enableDevelopmentEmails is false)"); //eslint-disable-line
    console.log("to: " + renderedEmail.to); //eslint-disable-line
    console.log("subject: " + renderedEmail.subject); //eslint-disable-line
    console.log("from: " + renderedEmail.from); //eslint-disable-line
    console.log("//////// HTML version"); //eslint-disable-line
    console.log(renderedEmail.html); //eslint-disable-line
    console.log("//////// Plain-text version"); //eslint-disable-line
    console.log(renderedEmail.text); //eslint-disable-line
    return false;
  }
}

export async function logSentEmail(renderedEmail: RenderedEmail, user: DbUser | null, additionalFields: any) {
  // Remove the html, which is very large and bloats LWEvents
  // We still have the text content of the email, which is sufficient for email history
  const { html, ...emailFields } = renderedEmail;

  // Replace user (object reference) in renderedEmail so we can log it in LWEvents
  const emailJson = {
    ...emailFields,
    user: user?._id,
  };
  // Log in LWEvents table
  await createLWEvent({
    data: {
      userId: user?._id,
      name: "emailSent",
      properties: {
        ...emailJson,
        ...additionalFields,
      },
      intercom: false,
    }
  }, createAnonymousContext())
}

// Returns a string explanation of why we can't send emails to a given user, or
// null if there is no such reason and we can email them.
export function reasonUserCantReceiveEmails(user: DbUser): string|null
{
  if (user.deleted)
    return "User is deactivated"
  if (!user.email)
    return "No email address";
  if (!userEmailAddressIsVerified(user))
    return "Address is not verified";
  if (user.unsubscribeFromAll)
    return "Setting 'Do not send me any emails' is checked";
  
  return null;
}

function makeAllUrlsAbsolute(html: string, relativeTo: string): string {
  const $ = cheerioParse(html);
  
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    
    // Skip if there's no href attribute or it's already absolute, empty, or just a hash
    if (!href || href.startsWith('http://') || href.startsWith('https://')
      || href === '' || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')
    ) {
      return;
    }
    
    try {
      const absoluteUrl = new URL(href, relativeTo).href;
      $(element).attr('href', absoluteUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Could not convert URL "${href}" to absolute: ${error}`);
    }
  });
  
  return $.html();
}
