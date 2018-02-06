import React, { Component } from 'react';

// Function that outputs a HoC that starts and stops polling based on the passed stopPollingIdleStatus
const withIdlePollingStoper = (stopPollingIdleStatus) => (WrappedComponent) => {
  class IdleStopper extends Component {
    constructor(props, context) {
      super(props, context);
      this.state = {
        polling: true,
      }
      if (this.props.pollInterval > 0) {
        this.props.startPolling(this.props.pollInterval);
        console.log("Initalizing IdleStopper, starting polling...");
      }
    }

    componentWillReceiveProps() {
      if (stopPollingIdleStatus === this.props.idleStatus && this.state.polling && this.props.pollInterval > 0) {
        this.props.stopPolling();
        this.setState({polling: false});
        console.log("Stopping polling");
      } else if (this.props.idleStatus === "ACTIVE" && !this.state.polling && this.props.pollInterval > 0) {
        this.props.startPolling(this.props.pollInterval);
        this.setState({polling: true});
        console.log("Starting polling again");
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (this.props.results === nextProps.results) {
        return false;
      } else {
        return true;
      }

    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }
  return IdleStopper
}

export default withIdlePollingStoper
