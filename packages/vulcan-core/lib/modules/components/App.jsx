import {
  Components,
  registerComponent,
  getSetting,
  Strings,
  runCallbacks,
  detectLocale,
  hasIntlFields,
  Routes
} from 'meteor/vulcan:lib';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, intlShape } from 'meteor/vulcan:i18n';
import withCurrentUser from '../containers/withCurrentUser.js';
import withUpdate from '../containers/withUpdate.js';
import withSiteData from '../containers/withSiteData.js';
import { withApollo } from 'react-apollo';
import { withCookies } from 'react-cookie';
import moment from 'moment';
import { matchPath } from 'react-router';
import { Switch, Route } from 'react-router-dom';
import { withRouter} from 'react-router';
import MessageContext from '../messages.js';
import qs from 'qs'

export const LocationContext = React.createContext("location");
export const SubscribeLocationContext = React.createContext("subscribeLocation");
export const NavigationContext = React.createContext("navigation");
export const ServerRequestStatusContext = React.createContext("serverRequestStatus");

export function parseQuery(location) {
  let query = location && location.search;
  if (!query) return {};

  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);

  return qs.parse(query);
}

class App extends PureComponent {
  constructor(props) {
    super(props);
    if (props.currentUser) {
      runCallbacks('events.identify', props.currentUser);
    }
    const { locale, localeMethod } = this.initLocale();
    this.state = {
      locale,
      localeMethod,
      messages: [],
    };
    moment.locale(locale);
  }

  /*

  Clear messages on route change
  See https://stackoverflow.com/a/45373907/649299

  */
  componentWillMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      this.clear();
    });
  }

  componentWillUnmount() {
      this.unlisten();
  }

  /*

  Show a flash message

  */
  flash = message => {
    this.setState({
      messages: [...this.state.messages, message]
    });
  }

  /*

  Clear all flash messages

  */
  clear = () => {
    // When clearing messages, we first set all current messages to have a hide property
    // And only after 500ms set the array to empty, to allow UI elements to show a fade-out animation
    this.setState({
      messages: this.state.messages.map(message => ({...message, hide: true}))
    })
    setTimeout(() => {
      this.setState({ messages: []});
    }, 500)
  }

  componentDidMount() {
    runCallbacks('app.mounted', this.props);
  }

  initLocale = () => {
    let userLocale = '';
    let localeMethod = '';
    const { currentUser, cookies, locale } = this.props;
    const availableLocales = Object.keys(Strings);
    const detectedLocale = detectLocale();

    if (locale) {
      // 1. locale is passed through SSR process
      // TODO: currently SSR locale is passed through cookies as a hack
      userLocale = locale;
      localeMethod = 'SSR';
    } else if (cookies && cookies.get('locale')) {
      // 2. look for a cookie
      userLocale = cookies.get('locale');
      localeMethod = 'cookie';
    } else if (currentUser && currentUser.locale) {
      // 3. if user is logged in, check for their preferred locale
      userLocale = currentUser.locale;
      localeMethod = 'user';
    } else if (detectedLocale) {
      // 4. else, check for browser settings
      userLocale = detectedLocale;
      localeMethod = 'browser';
    }
    // if user locale is available, use it; else compare first two chars
    // of user locale with first two chars of available locales
    const availableLocale = Strings[userLocale]
      ? userLocale
      : availableLocales.find(locale => locale.slice(0, 2) === userLocale.slice(0, 2));

    // 4. if user-defined locale is available, use it; else default to setting or `en-US`
    if (availableLocale) {
      return { locale: availableLocale, localeMethod };
    } else {
      return { locale: getSetting('locale', 'en-US'), localeMethod: 'setting' };
    }
  };

  getLocale = truncate => {
    return truncate ? this.state.locale.slice(0, 2) : this.state.locale;
  };

  setLocale = async locale => {
    const { cookies, updateUser, client, currentUser } = this.props;
    this.setState({ locale });
    cookies.remove('locale', { path: '/' });
    cookies.set('locale', locale, { path: '/' });
    // if user is logged in, change their `locale` profile property
    if (currentUser) {
      await updateUser({ selector: { documentId: currentUser._id }, data: { locale } });
    }
    moment.locale(locale);
    if (hasIntlFields) {
      client.resetStore();
    }
  };

  getChildContext() {
    return {
      getLocale: this.getLocale,
      setLocale: this.setLocale,
    };
  }

  componentWillUpdate(nextProps) {
    if (!this.props.currentUser && nextProps.currentUser) {
      runCallbacks('events.identify', nextProps.currentUser);
    }
  }

  parseRoute(location) {
    const routeNames = Object.keys(Routes);
    let currentRoute = null;
    let params={};
    for (let routeName of routeNames) {
      const route = Routes[routeName];
      const match = matchPath(location.pathname, { path: route.path, exact: true, strict: false });
      if (match) {
        currentRoute = route;
        params = match.params;
      }
    }

    const RouteComponent = currentRoute ? Components[currentRoute.componentName] : Components.Error404;
    return {
      currentRoute, RouteComponent, location, params,
      pathname: location.pathname,
      hash: location.hash,
      query: parseQuery(location),
    };
  }

  render() {
    const { flash } = this;
    const { messages } = this.state;
    const { currentUser, serverRequestStatus } = this.props;

    // Parse the location into a route/params/query/etc.
    const location = this.parseRoute(this.props.location);

    // Reuse the container objects for location and navigation context, so that
    // they will be reference-stable and won't trigger spurious rerenders.
    if (!this.locationContext) {
      this.locationContext = location;
    } else {
      Object.assign(this.locationContext, location);
    }

    if (!this.navigationContext) {
      this.navigationContext = {
        history: this.props.history
      };
    } else {
      this.navigationContext.history = this.props.history;
    }

    // subscribeLocationContext changes (by shallow comparison) whenever the
    // URL changes.
    if (!this.subscribeLocationContext || this.subscribeLocationContext.pathname != location.pathname) {
      this.subscribeLocationContext = location;
    } else {
      Object.assign(this.subscribeLocationContext, location);
    }

    const { RouteComponent } = location;
    return (
      <LocationContext.Provider value={this.locationContext}>
      <SubscribeLocationContext.Provider value={this.subscribeLocationContext}>
      <NavigationContext.Provider value={this.navigationContext}>
      <ServerRequestStatusContext.Provider value={serverRequestStatus}>
      <IntlProvider locale={this.getLocale()} key={this.getLocale()} messages={Strings[this.getLocale()]}>
        <MessageContext.Provider value={{ messages, flash, clear: this.clear }}>
          <Components.HeadTags image={getSetting('siteImage')} />
          <Components.ScrollToTop />
          <div className={`locale-${this.getLocale()}`}>
            <Components.Layout currentUser={currentUser} messages={messages}>
              {this.props.currentUserLoading
                ? <Components.Loading />
                : <RouteComponent />
              }
            </Components.Layout>
          </div>
        </MessageContext.Provider>
      </IntlProvider>
      </ServerRequestStatusContext.Provider>
      </NavigationContext.Provider>
      </SubscribeLocationContext.Provider>
      </LocationContext.Provider>
    );
  }
}

App.propTypes = {
  currentUserLoading: PropTypes.bool,
};

App.childContextTypes = {
  intl: intlShape,
  setLocale: PropTypes.func,
  getLocale: PropTypes.func,
};

App.displayName = 'App';

const updateOptions = {
  collectionName: 'Users',
  fragmentName: 'UsersCurrent',
};

//registerComponent('App', App, withCurrentUser, withSiteData, [withUpdate, updateOptions], withApollo, withCookies, withRouter);
// TODO LESSWRONG-Temporarily omit withCookies until it's debugged
registerComponent('App', App, withCurrentUser, withSiteData, [withUpdate, updateOptions], withApollo, withRouter);

export default App;
