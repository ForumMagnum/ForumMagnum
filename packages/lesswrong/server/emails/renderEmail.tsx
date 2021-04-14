import { createGenerateClassName, MuiThemeProvider } from '@material-ui/core/styles';
import htmlToText from 'html-to-text';
import Juice from 'juice';
import { sendEmailSmtp } from './sendEmail';
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';
import { renderToString } from 'react-dom/server';
import { SheetsRegistry } from 'react-jss/lib/jss';
import JssProvider from 'react-jss/lib/JssProvider';
import { TimezoneContext } from '../../components/common/withTimezone';
import { UserContext } from '../../components/common/withUser';
import LWEvents from '../../lib/collections/lwevents/collection';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { forumTitleSetting } from '../../lib/instanceSettings';
import moment from '../../lib/moment-timezone';
import { getForumTheme } from '../../themes/forumTheme';
import { DatabaseServerSetting } from '../databaseSettings';
import StyleValidator from '../vendor/react-html-email/src/StyleValidator';
import { Components, EmailRenderContext } from '../../lib/vulcan-lib/components';
import { createClient } from '../vulcan-lib/apollo-ssr/apolloClient';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createMutator } from '../vulcan-lib/mutators';
import { UnsubscribeAllToken } from '../emails/emailTokens';
import { captureException } from '@sentry/core';

export interface RenderedEmail {
  user: DbUser,
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
const emailGlobalCss = `
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
    color: #5f9b65
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
        ${emailGlobalCss}
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

export async function generateEmail({user, from, subject, bodyComponent, boilerplateGenerator=addEmailBoilerplate}: {
  user: DbUser,
  from?: string,
  subject: string,
  bodyComponent: React.ReactNode,
  boilerplateGenerator?: (props: {css:string, title: string, body: string})=>string,
}): Promise<RenderedEmail>
{
  if (!user) throw new Error("Missing required argument: user");
  if (!subject) throw new Error("Missing required argument: subject");
  if (!bodyComponent) throw new Error("Missing required argument: bodyComponent");
  
  // Set up Apollo
  const apolloClient = await createClient(await computeContextFromUser(user));
  
  // Wrap the body in Apollo, JSS, and MUI wrappers.
  const sheetsRegistry = new SheetsRegistry();
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  // TODO: Keep track of individual users' preferred time zone, and set this
  // accordingly so that time zones on posts/comments/etc are in that timezone.
  const timezone = moment.tz.guess();
  
  const wrappedBodyComponent = (
    <EmailRenderContext.Provider value={{isEmailRender:true}}>
    <ApolloProvider client={apolloClient}>
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
    <MuiThemeProvider theme={getForumTheme({name: "default", forumThemeOverride: {}})} sheetsManager={new Map()}>
    <UserContext.Provider value={user as unknown as UsersCurrent /*FIXME*/}>
    <TimezoneContext.Provider value={timezone}>
      {bodyComponent}
    </TimezoneContext.Provider>
    </UserContext.Provider>
    </MuiThemeProvider>
    </JssProvider>
    </ApolloProvider>
    </EmailRenderContext.Provider>
  );
  
  // Traverse the tree, running GraphQL queries and expanding the tree
  // accordingly.
  await getDataFromTree(wrappedBodyComponent);
  
  validateSheets(sheetsRegistry);
  
  // Render the REACT tree to an HTML string
  const body = renderToString(wrappedBodyComponent);
  
  // Get JSS styles, which were added to sheetsRegistry as a byproduct of
  // renderToString.
  const css = sheetsRegistry.toString();
  const html = boilerplateGenerator({ css, body, title:subject })
  
  // Since emails can't use <style> tags, only inline styles, use the Juice
  // library to convert accordingly.
  const inlinedHTML = Juice(html, { preserveMediaQueries: true });
  
  // Generate a plain-text representation, based on the React representation
  const plaintext = htmlToText.fromString(html, {
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
    user: user,
    to: user.email,
    from: fromAddress,
    subject: taggedSubject,
    html: emailDoctype + inlinedHTML,
    text: plaintext,
  }
}

export const wrapAndRenderEmail = async ({user, from, subject, body}: {user: DbUser, from?: string, subject: string, body: React.ReactNode}): Promise<RenderedEmail> => {
  const unsubscribeAllLink = await UnsubscribeAllToken.generateLink(user._id);
  return await generateEmail({
    user,
    from,
    subject: subject,
    bodyComponent: <Components.EmailWrapper
      user={user} unsubscribeAllLink={unsubscribeAllLink}
    >
      {body}
    </Components.EmailWrapper>
  });
}

export const wrapAndSendEmail = async ({user, from, subject, body}: {user: DbUser, from?: string, subject: string, body: React.ReactNode}): Promise<boolean> => {
  try {
    const email = await wrapAndRenderEmail({ user, from, subject, body });
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

function validateSheets(sheetsRegistry)
{
  let styleValidator = new StyleValidator();
  
  for (let sheet of sheetsRegistry.registry) {
    for (let rule of sheet.rules.index) {
      if (rule.style) {
        styleValidator.validate(rule.style, rule.selectorText);
      }
    }
  }
}


const enableDevelopmentEmailsSetting = new DatabaseServerSetting<boolean>('enableDevelopmentEmails', false)
export async function sendEmail(renderedEmail: RenderedEmail): Promise<boolean>
{
  if (process.env.NODE_ENV === 'production' || enableDevelopmentEmailsSetting.get()) {
    console.log("//////// Sending email..."); //eslint-disable-line
    console.log("to: " + renderedEmail.to); //eslint-disable-line
    console.log("subject: " + renderedEmail.subject); //eslint-disable-line
    console.log("from: " + renderedEmail.from); //eslint-disable-line
    
    return sendEmailSmtp(renderedEmail); // From meteor's 'email' package
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

export async function logSentEmail(renderedEmail: RenderedEmail, user: DbUser, additionalFields: any) {
  // Replace user (object reference) in renderedEmail so we can log it in LWEvents
  const emailJson = {
    ...renderedEmail,
    user: user._id,
  };
  // Log in LWEvents table
  await createMutator({
    collection: LWEvents,
    currentUser: user,
    document: {
      userId: user._id,
      name: "emailSent",
      properties: {
        ...emailJson,
        ...additionalFields,
      },
      intercom: false,
    },
    validate: false,
  })
}

// Returns a string explanation of why we can't send emails to a given user, or
// null if there is no such reason and we can email them.
export function reasonUserCantReceiveEmails(user: DbUser): string|null
{
  if (!user.email)
    return "No email address";
  if (!userEmailAddressIsVerified(user))
    return "Address is not verified";
  if (user.unsubscribeFromAll)
    return "Setting 'Do not send me any emails' is checked";
  
  return null;
}
