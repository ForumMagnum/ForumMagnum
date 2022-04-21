import moment from 'moment';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
// eslint-disable-next-line no-restricted-imports
import { withRouter } from 'react-router';
import { withCurrentUser } from '../../lib/crud/withCurrentUser';
import { DatabasePublicSetting, localeSetting } from '../../lib/publicSettings';
import { LocationContext, NavigationContext, parseRoute, ServerRequestStatusContext, SubscribeLocationContext, ServerRequestStatusContextType } from '../../lib/vulcan-core/appContext';
import { IntlProvider, intlShape } from '../../lib/vulcan-i18n';
import { Components, registerComponent, Strings } from '../../lib/vulcan-lib';
import { userIdentifiedCallback } from '../../lib/analyticsEvents';
import { MessageContext } from '../common/withMessages';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { TimeOverride, TimeContext } from '../../lib/utils/timeUtil';

const siteImageSetting = new DatabasePublicSetting<string | null>('siteImage', 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1503704344/sequencesgrid/h6vrwdypijqgsop7xwa0.jpg') // An image used to represent the site on social media

interface ExternalProps {
  apolloClient: any
  serverRequestStatus?: ServerRequestStatusContextType
  timeOverride: TimeOverride
}
interface AppProps extends ExternalProps {
  // From withRouter
  location: any
  history: any
  
  // From withCurrentUser HoC
  currentUser: UsersCurrent
}

class App extends PureComponent<AppProps,any> {
  locationContext: RouterLocation|null = null
  subscribeLocationContext: RouterLocation|null = null
  navigationContext: any
  
  constructor(props: AppProps) {
    super(props);
    if (props.currentUser) {
      void userIdentifiedCallback.runCallbacks({
        iterator: props.currentUser,
        properties: [],
      });
    }
    const locale = localeSetting.get();
    this.state = {
      locale,
      messages: [],
    };
    moment.locale(locale);
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

  getLocale = (truncate?: boolean) => {
    return truncate ? this.state.locale.slice(0, 2) : this.state.locale;
  };

  getChildContext() {
    return {
      getLocale: this.getLocale,
    };
  }

  UNSAFE_componentWillUpdate(nextProps: AppProps) {
    if (!this.props.currentUser && nextProps.currentUser) {
      void userIdentifiedCallback.runCallbacks({
        iterator: nextProps.currentUser,
        properties: [],
      });
    }
  }
  
  render() {
    const { flash } = this;
    const { messages } = this.state;
    const { currentUser, serverRequestStatus, timeOverride } = this.props;

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
      <ServerRequestStatusContext.Provider value={serverRequestStatus||null}>
      <TimeContext.Provider value={timeOverride}>
      <IntlProvider locale={this.getLocale()} key={this.getLocale()} messages={Strings[this.getLocale()]}>
        <MessageContext.Provider value={{ messages, flash, clear: this.clear }}>
          <Components.HeadTags image={siteImageSetting.get()} />
          <Components.ScrollToTop />
          <Components.Layout currentUser={currentUser} messages={messages}>
            <RouteComponent />
          </Components.Layout>
        </MessageContext.Provider>
      </IntlProvider>
      </TimeContext.Provider>
      </ServerRequestStatusContext.Provider>
      </NavigationContext.Provider>
      </SubscribeLocationContext.Provider>
      </LocationContext.Provider>
    );
  }
}

(App as any).childContextTypes = {
  intl: intlShape,
  getLocale: PropTypes.func,
};

//registerComponent('App', App, withCurrentUser, [withUpdate, updateOptions], withCookies, withRouter);
// TODO LESSWRONG-Temporarily omit withCookies until it's debugged
const AppComponent = registerComponent<ExternalProps>('App', App, {
  hocs: [
    withCurrentUser,
    withRouter
  ]
});



declare global {
  interface ComponentTypes {
    App: typeof AppComponent
  }
}

export default App; 
