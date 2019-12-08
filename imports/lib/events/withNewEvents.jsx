import { withNew } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import uuid from 'uuid/v4';
import { LWEvents } from '../collections/lwevents/collection.js';
import { shallowEqual } from '../modules/utils/componentUtils';


// HoC that passes functions for recording events to child
function withNewEvents(WrappedComponent) {
  class EventsWrapped extends Component {
    constructor(props) {
      super(props);
      this.state = {
        events: {},
      };
      this.recordEvent = this.recordEvent.bind(this);
      this.closeAllEvents = this.closeAllEvents.bind(this);
    }

    // Don't update on changes to state.events (which is this component's
    // only state), because that doesn't affect rendering at all and gets
    // modified in mount events.
    shouldComponentUpdate(nextProps, nextState) {
      if (!shallowEqual(this.props, nextProps))
        return true;
      return false;
    }

    // Record an event in the LWEvents table, eg a post-view. This is passed to
    // the wrapped component as a prop named recordEvent.
    //   name: (string) The type of the event.
    //   closeOnLeave: (bool) Whether to record a second event of the same type,
    //     with an endTime and duration, when this component unmounts, the
    //     user leaves the page, or closeAllEvents is called.
    //   properties: (JSON) Other properties to attach to the LWEvent record.
    recordEvent(name, closeOnLeave, properties) {
      const { createLWEvent } = this.props
      const { userId, documentId, important, intercom, ...rest} = properties;
      let event = {
        userId,
        name,
        documentId,
        important,
        properties: rest,
        intercom,
      };
      // Update properties with current time
      event.properties = {
        startTime: new Date(),
        ...event.properties,
      }
      const eventId = uuid();
      if (closeOnLeave) {
        this.setState(prevState => {
          prevState.events[eventId] = event;
          return prevState;
        });
      }
      createLWEvent({data: event});
      return eventId;
    }

    closeEvent(eventId, properties = {}) {
      const { createLWEvent } = this.props;
      let event = this.state.events[eventId];
      // Update properties with current time and duration in ms
      let currentTime = new Date();
      event.properties = {
        endTime: currentTime,
        duration: currentTime - event.properties.startTime,
        ...event.properties,
        ...properties,
      };
      createLWEvent({data: event});
      this.setState(prevState => {
        prevState.events = _.omit(prevState.events, eventId);
        return prevState;
      });
      return eventId;
    }

    // Record a close-event in the LWEvents table for any events that were
    // created with recordEvent and which haven't been closed yet. This is
    // passed to the wrapped component as a prop named closeAllEvents.
    closeAllEvents() {
      const events = this.state.events;
      Object.keys(events).forEach(key => {
        this.closeEvent(key);
      });
      this.setState(prevState => ({
        events: {}
      }));
    }

    // When unmounting, close all current event trackers. This happens when
    // following an on-site link to a different page, but there are two major
    // caveats:
    //  * This doesn't happen when navigating to a page with a sufficiently
    //    similar structure that the component gets reused, eg from one
    //    PostsPage to another PostsPage. To handle that case, make the wrapped
    //    component call closeAllEvents from inside componentDidUpdate.
    //  * This doesn't happen when closing the tab, or navigating to a
    //    different domain. TODO: Attach an event handler to make this work,
    //    if it can indeed be made to work.
    componentWillUnmount() {
      const events = this.state.events;
      Object.keys(events).forEach(key => {
        this.closeEvent(key);
      });
    }

    render() {
      return <WrappedComponent
        recordEvent={this.recordEvent}
        closeAllEvents={this.closeAllEvents}
        {...this.props}
      />
    }
  }
  return withNew({
    collection: LWEvents,
    fragmentName: 'newEventFragment',
  })(EventsWrapped);
}

export default withNewEvents;
