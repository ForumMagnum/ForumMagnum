import React, { Component } from 'react';
import { shallowEqual } from '../../lib/modules/utils/componentUtils';

const withGlobalKeydown = (WrappedComponent) => {
  return class ListeningComponent extends Component {
    state = { eventListeners: []}

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
