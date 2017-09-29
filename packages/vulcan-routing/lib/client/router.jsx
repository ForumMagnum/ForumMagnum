import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';

import { Meteor } from 'meteor/meteor';

import { InjectData } from 'meteor/vulcan:lib';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

export const RouterClient = {
  run(routes, options) {
    if (!options) {
      options = {};
    }

    Meteor.startup(() => {
      const rootElementName = options.rootElement || 'react-app';
      const rootElementType = options.rootElementType || 'div';
      const attributes = options.rootElementAttributes instanceof Array ? options.rootElementAttributes : [];
      let rootElement = document.getElementById(rootElementName);

      // In case the root element doesn't exist, let's create it
      if (!rootElement) {
        rootElement = document.createElement(rootElementType);
        rootElement.id = rootElementName;

        // check if a 2-dimensional array was passed... if not, be nice and handle it anyway
        if (attributes[0] instanceof Array) {
          // set attributes
          for (let i = 0; i < attributes.length; i++) {
            rootElement.setAttribute(attributes[i][0], attributes[i][1]);
          }
        } else if (attributes.length > 0) {
          rootElement.setAttribute(attributes[0], attributes[1]);
        }

        document.body.appendChild(rootElement);
      }

      // Rehydrate data client side, if desired.
      if (typeof options.rehydrateHook === 'function') {
        InjectData.getData('dehydrated-initial-data', (data) => {
          const rehydratedData = data ? JSON.parse(data) : undefined;
          options.rehydrateHook(rehydratedData);
        });
      }

      let history = browserHistory;

      if (typeof options.historyHook === 'function') {
        history = options.historyHook(history);
      }

      const appGenerator = addProps => {
        const muiTheme = getMuiTheme({
          "fontFamily": "ETBook",
          "palette": {
            "primary1Color": "#f5f5f5",
            "accent1Color": "#43a047",
            "primary2Color": "#eeeeee",
            "accent2Color": "#81c784",
            "accent3Color": "#c8e6c9",
            "pickerHeaderColor": "#4caf50"
          },
          "appBar": {
            "textColor": "rgba(0, 0, 0, 0.54)"
          },
          "datePicker": {
            "color": "rgba(0,0,0,0.54)",
            "selectTextColor": "rgba(0,0,0,0.54)",
          },
          "flatButton": {
            "primaryTextColor": "rgba(0,0,0,0.54)"
          }
        });
        return <MuiThemeProvider muiTheme={muiTheme}>
          <Router
            history={history}
            {...options.props}
            {...addProps}
          >
            {routes}
          </Router>
        </MuiThemeProvider>
      };

      let app;
      if (typeof options.wrapperHook === 'function') {
        app = options.wrapperHook(appGenerator);
      }

      if (typeof options.renderHook === 'function') {
        options.renderHook(app, rootElement);
      } else {
        ReactDOM.render(app, rootElement);
      }

      const collectorEl = document.getElementById(options.styleCollectorId || 'css-style-collector-data');

      if (collectorEl) {
        collectorEl.parentNode.removeChild(collectorEl);
      }
    });
  },
};
