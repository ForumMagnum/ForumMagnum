import moment from 'moment';
import React, { PureComponent } from 'react';
// eslint-disable-next-line no-restricted-imports
import { withRouter } from 'react-router';
import { withCurrentUser } from '../../lib/crud/withCurrentUser';
import { DatabasePublicSetting, localeSetting } from '../../lib/publicSettings';
import { LocationContext, NavigationContext, parseRoute, ServerRequestStatusContext, SubscribeLocationContext, ServerRequestStatusContextType } from '../../lib/vulcan-core/appContext';
import { Components, registerComponent, userChangedCallback } from '../../lib/vulcan-lib';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { TimeOverride, TimeContext } from '../../lib/utils/timeUtil';
import type { History } from 'history';
import { MessageContextProvider } from '../common/FlashMessages';

export const siteImageSetting = new DatabasePublicSetting<string>('siteImage', 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1654295382/new_mississippi_river_fjdmww.jpg') // An image used to represent the site on social media

interface ExternalProps {
  apolloClient: any
  serverRequestStatus?: ServerRequestStatusContextType
  timeOverride: TimeOverride
}
interface AppProps extends ExternalProps {
  // From withRouter
  location: any
  history: History
  
  // From withCurrentUser HoC
  currentUser: UsersCurrent
  currentUserLoading: boolean
}

class App extends PureComponent<AppProps,any> {
  locationContext: RouterLocation|null = null
  subscribeLocationContext: RouterLocation|null = null
  navigationContext: { history: History }
  
  constructor(props: AppProps) {
    super(props);
    void userChangedCallback.runCallbacks({
      iterator: props.currentUser,
      properties: [],
    });
    const locale = localeSetting.get();
    moment.locale(locale);
  }

  UNSAFE_componentWillUpdate(nextProps: AppProps) {
    if (this.props.currentUser?._id !== nextProps.currentUser?._id) {
      void userChangedCallback.runCallbacks({
        iterator: nextProps.currentUser,
        properties: [],
      });
    }
  }
  
  render() {
    const { currentUser, currentUserLoading, serverRequestStatus, timeOverride } = this.props;

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
    // FIXME: Also needs to include changes to hash and to query params
    if (!this.subscribeLocationContext
      || this.subscribeLocationContext.pathname != location.pathname
      || JSON.stringify(this.subscribeLocationContext.query) != JSON.stringify(location.query)
      || this.subscribeLocationContext.hash != location.hash
    ) {
      this.subscribeLocationContext = {...location};
    } else {
      Object.assign(this.subscribeLocationContext, location);
    }

    const { RouteComponent } = location;
    
    // If logged in but waiting for currentUser to load, don't render stuff.
    // (Otherwise the logged-in SSR winds up doing the queries for, and sending
    // an Apollo cache containing the results of, the union of both logged-in
    // and logged-out views.)
    if (currentUserLoading && !currentUser) {
      return <Components.Loading/>
    }
    
    return (
      <LocationContext.Provider value={this.locationContext}>
      <SubscribeLocationContext.Provider value={this.subscribeLocationContext}>
      <NavigationContext.Provider value={this.navigationContext}>
      <ServerRequestStatusContext.Provider value={serverRequestStatus||null}>
      <TimeContext.Provider value={timeOverride}>
        <MessageContextProvider>
          <Components.HeadTags image={siteImageSetting.get()} />
          <Components.ScrollToTop />
          <Components.Layout currentUser={currentUser}>
            <RouteComponent />
          </Components.Layout>
        </MessageContextProvider>
      </TimeContext.Provider>
      </ServerRequestStatusContext.Provider>
      </NavigationContext.Provider>
      </SubscribeLocationContext.Provider>
      </LocationContext.Provider>
    );
  }
}

const AppComponent = registerComponent<ExternalProps>('App', App, {
  hocs: [
    withCurrentUser,
    withRouter,
  ]
});


declare global {
  interface ComponentTypes {
    App: typeof AppComponent
  }
}

export default App;
