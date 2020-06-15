/**
 * The App + relevant wrappers
 */
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Components } from '../../lib/vulcan-lib';
import { wrapWithMuiTheme } from '../themeProvider';
import { CookiesProvider } from 'react-cookie';
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';

const AppGenerator = ({ apolloClient }) => {
  const App = (
    <ApolloProvider client={apolloClient}>
        <CookiesProvider>
            <BrowserRouter>
                <Components.App />
            </BrowserRouter>
        </CookiesProvider>
    </ApolloProvider>
  );
  return wrapWithMuiTheme(App);
};
export default AppGenerator;
