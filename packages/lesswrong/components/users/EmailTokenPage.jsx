import React, {Component} from 'react';
import { Components, registerComponent, withMutation } from 'meteor/vulcan:core';
import { withLocation } from '../../lib/routeUtil';

class EmailTokenPage extends Component
{
  state = {
    loading: true,
    useTokenResult: null
  };
  
  componentDidMount() {
    const { params } = this.props.location;
    const { token } = params;
    this.props.useEmailToken({token}).then((mutationResult) => {
      this.setState({
        loading: false,
        useTokenResult: mutationResult.data.useEmailToken,
      });
    });
  }
  
  render = () => {
    const { loading, useTokenResult } = this.state;
    if (loading)
      return <Components.Loading/>
    
    const ResultComponent = Components[useTokenResult.componentName];
    return <ResultComponent {...useTokenResult.props}/>
  }
}

registerComponent("EmailTokenPage", EmailTokenPage,
  withLocation,
  withMutation({
    name: "useEmailToken",
    args: {token: 'String'}
  })
);
