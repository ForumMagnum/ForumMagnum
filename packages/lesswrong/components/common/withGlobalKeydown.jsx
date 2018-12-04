import React, { Component } from 'react';

const withGlobalKeydown = (WrappedComponent) => {
  return class ListeningComponent extends Component {
    state = { eventListeners: []}

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
