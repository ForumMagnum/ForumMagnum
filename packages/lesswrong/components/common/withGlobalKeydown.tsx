import React, { Component } from 'react';
import { shallowEqual } from '../../lib/utils/componentUtils';
import { Meteor } from 'meteor/meteor';

interface ListeningComponentState {
  eventListeners: Array<any>,
}

const withGlobalKeydown = (WrappedComponent) => {
  return class ListeningComponent extends Component<any,ListeningComponentState> {
    state: ListeningComponentState = { eventListeners: []}

    shouldComponentUpdate(nextProps, nextState) {
      // Don't update in response to state change (the only state is
      // `eventListeners`). Do update in response to props changes.
      return !shallowEqual(this.props, nextProps);
    }
    
    addKeydownListener = (callback) => {
      if (Meteor.isClient) {
        document.addEventListener('keydown', callback)
        this.setState((prevState) => {
           return { eventListeners: [...prevState.eventListeners, callback] }
        });
      }
    }

    componentWillUnmount() {
      if (Meteor.isClient) {
        this.state.eventListeners.forEach((callback) => {
          document.removeEventListener('keydown', callback);
        })
      }
    }

    render () {
      return <WrappedComponent { ...this.props } addKeydownListener={this.addKeydownListener }/>
    }
  }
}

export default withGlobalKeydown

export const useGlobalKeydown = (keyboardHandlerFn) => {
  React.useEffect(() => {
    if (Meteor.isClient) {
      document.addEventListener('keydown', keyboardHandlerFn)
      
      return function cleanup() {
        document.removeEventListener('keydown', keyboardHandlerFn);
      };
    }
  });
}
