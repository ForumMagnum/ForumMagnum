import React from 'react';
import { renderToString } from 'react-dom/server';
import { ApolloProvider } from 'react-apollo';
import Juice from 'juice';
import { createApolloClient, configureStore } from 'meteor/vulcan:lib';
import JssProvider from 'react-jss/lib/JssProvider';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import htmlToText from 'html-to-text';

// TODO: We probably want to use a different theme than this for rendering
// emails.
import forumTheme from '../../themes/forumTheme'

// HACK: This getDataFromTree is awkwardly plucked from a newer version of
// Apollo (Apollo 2.0). We do the same thing in Vulcan. After the Apollo
// upgrade, we'll want to use Apollo's instead.
import getDataFromTree from './getDataFromTree';

// How many characters to wrap the plain-text version of the email to
const plainTextWordWrap = 80;

// Doctype string at the header of HTML emails
export const emailDoctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';


// Render an email. Arguments:
//
//   user: A user object. The user the email is being sent to, and also the
//     user whose perspective the body is rendered from (ie, withCurrentUser
//     will get this user).
//   subject: String. The email subject line.
//   bodyComponent: A React component, which will be used to render the body.
//
// The same components HoCs that are used for rendering pages, can also be used
// in emails, with some restrictions:
//   * Everything must be server-side rendered.
//   * No click handlers, componentDidMount, or other client-side Javascript.
//   * While any JSS in withStyles will be included in the email, only a very
//     limited and inconsistent subset is supported by mail clients
//
export async function generateEmail({user, subject, bodyComponent})
{
  // Set up Apollo
  //TODO: Get a loginToken corresponding to the right user
  const loginToken = null;
  const locale = null;
  const apolloClient = createApolloClient({ loginToken, locale });
  const reducers = {apollo: apolloClient.reducer()};
  const store = configureStore(reducers, {}, []);
  
  // Wrap the body in Apollo, JSS, and MUI wrappers.
  const sheetsRegistry = new SheetsRegistry();
  const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: true
  });
  
  const wrappedBodyComponent = (
    <ApolloProvider store={store} client={apolloClient}>
      <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
        <MuiThemeProvider theme={forumTheme} sheetsManager={new Map()}>
          {bodyComponent}
        </MuiThemeProvider>
      </JssProvider>
    </ApolloProvider>
  );
  
  // Traverse the tree, running GraphQL queries and expanding the tree
  // accordingly.
  await getDataFromTree(wrappedBodyComponent);
  
  // Render the REACT tree to an HTML string
  const body = renderToString(wrappedBodyComponent);
  
  // Get JSS styles, which were added to sheetsRegistry as a byproduct of
  // renderToString.
  const css = sheetsRegistry.toString();
  const styleTag = (css && css.length>0) ? `<style>${css}</style>` : "";
  
  const html = `${styleTag}<body>${body}</body>`;
  
  // Since emails can't use <style> tags, only inline styles, use the Juice
  // library to convert accordingly.
  const inlinedHTML = Juice(html, { preserveMediaQueries: true });
  
  // Generate a plain-text representation, based on the React representation
  const plaintext = htmlToText.fromString(html, {
    wordwrap: plainTextWordWrap
  });
  
  
  return {
    user: user,
    to: user.email,
    subject: subject,
    bodyHtml: emailDoctype + inlinedHTML,
    bodyText: plaintext,
  }
}