import {
  Components, registerComponent, getSetting, Strings, runCallbacks, detectLocale,
  MessageContext,
  LocationContext, SubscribeLocationContext, NavigationContext, ServerRequestStatusContext, parseRoute,
} from 'meteor/vulcan:core';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { PureComponent } from 'react';
import { withCurrentUser } from '../../lib/crud/withCurrentUser';
import PropTypes from 'prop-types';
import { IntlProvider, intlShape } from 'meteor/vulcan:i18n';
import { withApollo } from 'react-apollo';
import moment from 'moment';
import { withRouter } from 'react-router';

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

  initLocale = () => {
    let userLocale = '';
    let localeMethod = '';
    const { cookies, locale } = this.props;
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
    } else if (detectedLocale) {
      // 3. else, check for browser settings
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
    const { cookies, updateUser, currentUser } = this.props;
    this.setState({ locale });
    cookies.remove('locale', { path: '/' });
    cookies.set('locale', locale, { path: '/' });
    // if user is logged in, change their `locale` profile property
    if (currentUser) {
      await updateUser({ selector: { documentId: currentUser._id }, data: { locale } });
    }
    moment.locale(locale);
  };

  getChildContext() {
    return {
      getLocale: this.getLocale,
      setLocale: this.setLocale,
    };
  }

  UNSAFE_componentWillUpdate(nextProps) {
    if (!this.props.currentUser && nextProps.currentUser) {
      runCallbacks('events.identify', nextProps.currentUser);
    }
  }
  
  render() {
    const { flash } = this;
    const { messages } = this.state;
    const { currentUser, serverRequestStatus } = this.props;

    // Parse the location into a route/params/query/etc.
    const location = parseRoute({location: this.props.location});
    
    if (location.redirected) {
      return <Components.PermanentRedirect url={location.url}/>
    }
    
    // Reuse the container objects for location and navigation context, so that
    // they will be reference-stable and won't trigger spurious rerenders.
    if (!this.locationContext) {
      this.locationContext = {...location};
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
      this.subscribeLocationContext = {...location};
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
          <Components.Layout currentUser={currentUser} messages={messages}>
            {this.props.currentUserLoading
              ? <Components.Loading />
              : <RouteComponent />
            }
          </Components.Layout>
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

//registerComponent('App', App, withCurrentUser, [withUpdate, updateOptions], withApollo, withCookies, withRouter);
// TODO LESSWRONG-Temporarily omit withCookies until it's debugged
registerComponent('App', App, withCurrentUser, [withUpdate, updateOptions], withApollo, withRouter);

export default App;
