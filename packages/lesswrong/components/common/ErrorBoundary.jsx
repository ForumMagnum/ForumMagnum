import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error, info) {
    this.setState({ error: error.toString() });
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      return <div className="errorText">Error: {this.state.error}</div>;
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

registerComponent("ErrorBoundary", ErrorBoundary);
