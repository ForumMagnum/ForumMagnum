import React, { Component } from 'react';
import { isClient } from '../../lib/executionEnvironment';

interface ListeningComponentState {
  eventListeners: Array<(event: KeyboardEvent)=>void>,
}

const withGlobalKeydown = (WrappedComponent) => {
  return class ListeningComponent extends Component<any,ListeningComponentState> {
    state: ListeningComponentState = { eventListeners: []}
    
    addKeydownListener = (callback: (event: KeyboardEvent)=>void) => {
      if (isClient) {
        document.addEventListener('keydown', callback)
        // Store event listener by modifying state in-place, rather than
        // changing the (shallow-comparison) state, so that this doesn't
        // trigger a rerender.
        this.state.eventListeners.push(callback);
      }
    }

    componentWillUnmount() {
      if (isClient) {
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

export const useGlobalKeydown = (keyboardHandlerFn: (this: Document, ev: KeyboardEvent)=>any) => {
  React.useEffect(() => {
    if (isClient) {
      document.addEventListener('keydown', keyboardHandlerFn)
      
      return function cleanup() {
        document.removeEventListener('keydown', keyboardHandlerFn);
      };
    }
  });
}
